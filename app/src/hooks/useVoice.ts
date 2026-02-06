import { useRef, useState, useCallback } from "react";

const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

export function useVoice(sessionId: string, questionId: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const ownStreamRef = useRef<boolean>(false);

    const [liveText, setLiveText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [isRecording, setIsRecording] = useState(false);

    // Convert Float32Array to 16-bit PCM
    const floatTo16BitPCM = useCallback((float32Array: Float32Array): ArrayBuffer => {
        const buffer = new ArrayBuffer(float32Array.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }, []);

    // Resample audio to 16kHz
    const resample = useCallback((audioBuffer: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array => {
        if (fromSampleRate === toSampleRate) {
            return audioBuffer;
        }
        const ratio = fromSampleRate / toSampleRate;
        const newLength = Math.round(audioBuffer.length / ratio);
        const result = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
            const srcIndex = i * ratio;
            const srcIndexFloor = Math.floor(srcIndex);
            const srcIndexCeil = Math.min(srcIndexFloor + 1, audioBuffer.length - 1);
            const t = srcIndex - srcIndexFloor;
            result[i] = audioBuffer[srcIndexFloor] * (1 - t) + audioBuffer[srcIndexCeil] * t;
        }
        return result;
    }, []);

    // Start function now accepts an optional external stream
    const start = async (externalStream?: MediaStream | null) => {
        try {
            let stream: MediaStream;

            // Use external stream if provided, otherwise create our own
            if (externalStream && externalStream.getAudioTracks().length > 0) {
                stream = externalStream;
                ownStreamRef.current = false;
                console.log("[Voice] Using external audio stream");

                // Make sure audio tracks are enabled
                stream.getAudioTracks().forEach(track => {
                    track.enabled = true;
                    console.log(`[Voice] Audio track: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
                });
            } else {
                // Create our own stream
                console.log("[Voice] Creating new audio stream...");
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    }
                });
                ownStreamRef.current = true;
                console.log("[Voice] Created new audio stream");
            }

            streamRef.current = stream;

            const ws = new WebSocket(
                `ws://localhost:8000/ws/voice/${sessionId}/${questionId}`
            );
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("[Voice] WebSocket connection established");
                setIsRecording(true);

                // Create AudioContext - browser will use its default sample rate
                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;

                const actualSampleRate = audioContext.sampleRate;
                console.log(`[Voice] Browser sample rate: ${actualSampleRate}Hz, target: ${SAMPLE_RATE}Hz`);

                const source = audioContext.createMediaStreamSource(stream);
                const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
                processorRef.current = processor;

                let chunkCount = 0;

                processor.onaudioprocess = (e) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const inputData = e.inputBuffer.getChannelData(0);

                        // Resample to 16kHz
                        const resampled = resample(inputData, actualSampleRate, SAMPLE_RATE);
                        const pcmData = floatTo16BitPCM(resampled);

                        chunkCount++;
                        if (chunkCount % 20 === 0) {
                            // Calculate audio level (RMS) to verify audio is captured
                            const rms = Math.sqrt(inputData.reduce((sum, x) => sum + x * x, 0) / inputData.length);
                            console.log(`[Voice] Chunk ${chunkCount}: ${pcmData.byteLength} bytes, RMS: ${rms.toFixed(4)}`);
                        }

                        ws.send(pcmData);
                    }
                };

                source.connect(processor);
                processor.connect(audioContext.destination);
                console.log(`[Voice] Audio capture started - resampling from ${actualSampleRate}Hz to ${SAMPLE_RATE}Hz`);
            };

            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.partial !== undefined && data.partial) {
                    console.log("[Voice] Partial:", data.partial);
                    setLiveText(data.partial);
                }
                if (data.final) {
                    console.log("[Voice] Final:", data.final);
                    setFinalText((p) => p + " " + data.final);
                    setLiveText("");
                }
            };

            ws.onclose = () => {
                console.log("[Voice] WebSocket connection closed");
                setIsRecording(false);
            };

            ws.onerror = (err) => {
                console.error("[Voice] WebSocket error:", err);
                stop();
            };
        } catch (err) {
            console.error("[Voice] Error starting voice recorder:", err);
        }
    };

    const stop = () => {
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        // Only stop our own stream, not the external one
        if (ownStreamRef.current && streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
        streamRef.current = null;
        setIsRecording(false);
        setLiveText("");
    };

    return { start, stop, liveText, finalText, isRecording, setFinalText };
}
