import { useRef, useState } from "react";

export function useVoice(sessionId: string, questionId: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [liveText, setLiveText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ws = new WebSocket(
                `ws://localhost:8000/ws/voice/${sessionId}/${questionId}`
            );
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket connection established");
                setIsRecording(true);

                // Start MediaRecorder ONLY after WebSocket is open
                const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
                recorderRef.current = rec;

                rec.ondataavailable = async (e) => {
                    if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
                        console.log("Sending audio chunk:", e.data.size, "bytes");
                        ws.send(await e.data.arrayBuffer());
                    }
                };

                rec.onerror = (err) => {
                    console.error("MediaRecorder error:", err);
                };

                rec.start(250);
                console.log("MediaRecorder started");
            };

            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                console.log("Received from server:", data);
                if (data.partial !== undefined) setLiveText(data.partial);
                if (data.final) {
                    setFinalText((p) => p + " " + data.final);
                    setLiveText("");
                }
            };

            ws.onclose = () => {
                console.log("WebSocket connection closed");
                setIsRecording(false);
            };

            ws.onerror = (err) => {
                console.error("WebSocket error:", err);
                stop();
            };
        } catch (err) {
            console.error("Error starting voice recorder:", err);
        }
    };

    const stop = () => {
        if (recorderRef.current && recorderRef.current.state !== "inactive") {
            recorderRef.current.stop();
        }
        if (wsRef.current) {
            wsRef.current.close();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setIsRecording(false);
        setLiveText("");
    };

    return { start, stop, liveText, finalText, isRecording, setFinalText };
}
