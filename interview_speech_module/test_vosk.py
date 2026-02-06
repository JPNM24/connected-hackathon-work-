"""
Test script to verify Vosk speech recognition is working correctly.
Run this to test if Vosk can recognize speech from your microphone.
"""
import pyaudio
import json
from vosk import Model, KaldiRecognizer

MODEL = Model("vosk-model-small-en-us-0.15")

SAMPLE_RATE = 16000
CHUNK_SIZE = 4096

def test_microphone():
    print("=" * 50)
    print("Testing Vosk Speech Recognition")
    print("=" * 50)
    print(f"Sample rate: {SAMPLE_RATE} Hz")
    print(f"Chunk size: {CHUNK_SIZE}")
    print("")
    print("Speak into your microphone... (Press Ctrl+C to stop)")
    print("")

    recognizer = KaldiRecognizer(MODEL, SAMPLE_RATE)
    recognizer.SetWords(True)

    p = pyaudio.PyAudio()
    
    # Find the default input device
    device_info = p.get_default_input_device_info()
    print(f"Using input device: {device_info['name']}")
    print("")

    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=SAMPLE_RATE,
        input=True,
        frames_per_buffer=CHUNK_SIZE
    )

    try:
        while True:
            data = stream.read(CHUNK_SIZE, exception_on_overflow=False)
            
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                if result.get("text"):
                    print(f"[FINAL] {result['text']}")
            else:
                partial = json.loads(recognizer.PartialResult())
                if partial.get("partial"):
                    print(f"[PARTIAL] {partial['partial']}", end="\r")

    except KeyboardInterrupt:
        print("\n\nStopping...")
    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()

if __name__ == "__main__":
    test_microphone()
