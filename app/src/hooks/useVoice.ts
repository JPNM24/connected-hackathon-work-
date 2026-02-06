import { useRef, useState, useCallback, useEffect } from "react";

const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

interface AudioDevice {
    deviceId: string;
    label: string;
}

export function useVoice(sessionId: string, questionId: string) {
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const [liveText, setLiveText] = useState("");
    const [finalText, setFinalText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>("default");
    const [audioLevel, setAudioLevel] = useState(0);

    // Enumerate audio devices on mount
    useEffect(() => {
        const getDevices = async () => {
            try {
                // Request permission first
                await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
                    s.getTracks().forEach(t => t.stop());
                });

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioInputs = devices
                    .filter(d => d.kind === 'audioinput')
                    .map(d => ({
                        deviceId: d.deviceId,
                        label: d.label || `Microphone ${d.deviceId.substring(0, 8)}`
                    }));

                console.log("[Voice] Found audio devices:", audioInputs);
                setAudioDevices(audioInputs);

                // Try to find a non-array microphone as default
                const nonArrayMic = audioInputs.find(d =>
                    !d.label.toLowerCase().includes('array') &&
                    d.deviceId !== 'default'
                );
                if (nonArrayMic) {
                    console.log("[Voice] Preferring non-array mic:", nonArrayMic.label);
                    setSelectedDevice(nonArrayMic.deviceId);
                }
            } catch (err) {
                console.error("[Voice] Error enumerating devices:", err);
            }
        };
        getDevices();
    }, []);

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

    // Try to get a working audio stream, trying multiple devices if needed
    const getWorkingAudioStream = async (): Promise<MediaStream | null> => {
        const devicesToTry = selectedDevice !== 'default'
            ? [selectedDevice, 'default', ...audioDevices.map(d => d.deviceId)]
            : ['default', ...audioDevices.map(d => d.deviceId)];

        // Remove duplicates
        const uniqueDevices = [...new Set(devicesToTry)];

        for (const deviceId of uniqueDevices) {
            try {
                console.log(`[Voice] Trying device: ${deviceId}`);

                const constraints: MediaStreamConstraints = {
                    audio: {
                        deviceId: deviceId === 'default' ? undefined : { exact: deviceId },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                const track = stream.getAudioTracks()[0];

                console.log(`[Voice] Got track: ${track.label}, muted: ${track.muted}`);

                // Check if track is not muted
                if (!track.muted) {
                    console.log(`[Voice] ✅ Found working microphone: ${track.label}`);
                    return stream;
                } else {
                    console.log(`[Voice] ⚠️ Device ${track.label} is muted at hardware level, trying next...`);
                    stream.getTracks().forEach(t => t.stop());
                }
            } catch (err) {
                console.log(`[Voice] Failed to get device ${deviceId}:`, err);
            }
        }

        // If all devices are muted, use the first one anyway and warn user
        console.warn("[Voice] All microphones appear to be muted. Using default device anyway.");
        console.warn("[Voice] Please check: Windows Settings → Privacy → Microphone → Allow apps to access microphone");

        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: false
            });
        } catch (err) {
            console.error("[Voice] Cannot access any microphone:", err);
            return null;
        }
    };

    // Start recording
    const start = async () => {
        try {
            console.log("[Voice] Starting audio capture...");

            const stream = await getWorkingAudioStream();
            if (!stream) {
                console.error("[Voice] No microphone available");
                return;
            }

            streamRef.current = stream;
            const track = stream.getAudioTracks()[0];
            console.log(`[Voice] Using: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`);

            const ws = new WebSocket(
                `ws://localhost:8000/ws/voice/${sessionId}/${questionId}`
            );
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log("[Voice] WebSocket connection established");
                setIsRecording(true);

                // Create AudioContext and RESUME it
                const audioContext = new AudioContext();
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }
                audioContextRef.current = audioContext;

                const actualSampleRate = audioContext.sampleRate;
                console.log(`[Voice] AudioContext: ${audioContext.state}, ${actualSampleRate}Hz → ${SAMPLE_RATE}Hz`);

                const source = audioContext.createMediaStreamSource(stream);
                sourceRef.current = source;

                // Create analyser for visual feedback
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);

                const processor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);
                processorRef.current = processor;

                let chunkCount = 0;
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                processor.onaudioprocess = (e) => {
                    if (ws.readyState === WebSocket.OPEN) {
                        const inputData = e.inputBuffer.getChannelData(0);

                        // Calculate audio level for UI feedback
                        analyser.getByteFrequencyData(dataArray);
                        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                        setAudioLevel(Math.min(100, (avg / 128) * 100));

                        // Resample to 16kHz
                        const resampled = resample(inputData, actualSampleRate, SAMPLE_RATE);
                        const pcmData = floatTo16BitPCM(resampled);

                        chunkCount++;
                        if (chunkCount % 50 === 0) {
                            const rms = Math.sqrt(inputData.reduce((sum, x) => sum + x * x, 0) / inputData.length);
                            console.log(`[Voice] Chunk ${chunkCount}, RMS: ${rms.toFixed(4)}, Level: ${avg.toFixed(0)}`);
                        }

                        ws.send(pcmData);
                    }
                };

                source.connect(processor);
                processor.connect(audioContext.destination);
                console.log("[Voice] Audio capture started");
            };

            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.partial !== undefined && data.partial) {
                    setLiveText(data.partial);
                }
                if (data.final) {
                    console.log("[Voice] Transcribed:", data.final);
                    setFinalText((p) => (p + " " + data.final).trim());
                    setLiveText("");
                }
                if (data.metrics) {
                    console.log("[Voice] Metrics:", data.metrics);
                }
            };

            ws.onclose = () => {
                console.log("[Voice] WebSocket closed");
                setIsRecording(false);
                setAudioLevel(0);
            };

            ws.onerror = (err) => {
                console.error("[Voice] WebSocket error:", err);
                stop();
            };
        } catch (err) {
            console.error("[Voice] Error:", err);
        }
    };

    const stop = () => {
        if (sourceRef.current) {
            try { sourceRef.current.disconnect(); } catch (e) { }
            sourceRef.current = null;
        }
        if (processorRef.current) {
            try { processorRef.current.disconnect(); } catch (e) { }
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
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
        setLiveText("");
        setAudioLevel(0);
    };

    return {
        start,
        stop,
        liveText,
        finalText,
        isRecording,
        setFinalText,
        audioDevices,
        selectedDevice,
        setSelectedDevice,
        audioLevel
    };
}
