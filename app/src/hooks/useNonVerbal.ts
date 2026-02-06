import { useRef, useState, useCallback, useEffect } from "react";

const FRAME_INTERVAL = 200; // Send frame every 200ms (5 FPS for efficiency)

export interface NonVerbalScores {
    eye_contact: number | null;
    facial_expression: number | null;
    posture: number | null;
    stability: number | null;
    final_non_verbal_score: number | null;
}

export interface NonVerbalResult {
    session_status: string;
    non_verbal_scores: NonVerbalScores;
    insights: string[];
}

export function useNonVerbal(sessionId: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const intervalRef = useRef<number | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scores, setScores] = useState<NonVerbalScores>({
        eye_contact: null,
        facial_expression: null,
        posture: null,
        stability: null,
        final_non_verbal_score: null
    });
    const [status, setStatus] = useState<string>("idle");
    const [insights, setInsights] = useState<string[]>([]);
    const [frameCount, setFrameCount] = useState(0);

    // Create hidden canvas for frame capture
    useEffect(() => {
        if (!canvasRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = 320;  // Lower resolution for efficiency
            canvas.height = 240;
            canvasRef.current = canvas;
        }
        return () => {
            canvasRef.current = null;
        };
    }, []);

    // Capture a frame from the video element
    const captureFrame = useCallback((): string | null => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState < 2) {
            return null;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64 JPEG (more efficient than PNG)
        return canvas.toDataURL('image/jpeg', 0.7);
    }, []);

    // Start analyzing
    const start = useCallback((videoElement: HTMLVideoElement) => {
        if (isAnalyzing) return;

        videoRef.current = videoElement;
        console.log("[NonVerbal] Starting analysis...");

        // Connect to WebSocket
        const ws = new WebSocket(`ws://localhost:8001/ws/video/${sessionId}`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[NonVerbal] WebSocket connected");
            setIsAnalyzing(true);
            setStatus("analyzing");

            // Start sending frames at regular intervals
            intervalRef.current = window.setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    const frameData = captureFrame();
                    if (frameData) {
                        ws.send(frameData);
                        setFrameCount(prev => prev + 1);
                    }
                }
            }, FRAME_INTERVAL);
        };

        ws.onmessage = (event) => {
            try {
                const result: NonVerbalResult = JSON.parse(event.data);

                if (result.session_status === "active") {
                    setScores(result.non_verbal_scores);
                    setInsights(result.insights || []);
                    setStatus("active");
                } else if (result.session_status === "cancelled") {
                    setStatus("cancelled");
                    stop();
                } else if (result.session_status === "insufficient_data") {
                    setStatus("waiting");
                }
            } catch (err) {
                console.error("[NonVerbal] Error parsing response:", err);
            }
        };

        ws.onclose = () => {
            console.log("[NonVerbal] WebSocket disconnected");
            setIsAnalyzing(false);
        };

        ws.onerror = (err) => {
            console.error("[NonVerbal] WebSocket error:", err);
            setStatus("error");
        };
    }, [sessionId, captureFrame, isAnalyzing]);

    // Stop analyzing
    const stop = useCallback(() => {
        console.log("[NonVerbal] Stopping analysis...");

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsAnalyzing(false);
        setStatus("stopped");
    }, []);

    // Get final analysis
    const getAnalysis = useCallback(async (): Promise<{
        non_verbal_scores: NonVerbalScores;
        pass_status: string;
    } | null> => {
        try {
            const response = await fetch(`http://localhost:8001/analyze_session/${sessionId}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to get analysis');
            }

            return await response.json();
        } catch (err) {
            console.error("[NonVerbal] Error getting analysis:", err);
            return null;
        }
    }, [sessionId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    return {
        start,
        stop,
        isAnalyzing,
        scores,
        status,
        insights,
        frameCount,
        getAnalysis
    };
}
