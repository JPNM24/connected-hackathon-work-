from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
import tempfile
import os
import wave
from speech_utils import *
from vosk import KaldiRecognizer

main = FastAPI()

# CORS configuration for Vite frontend
main.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sessions = {}

@main.websocket("/ws/voice/{session_id}/{question_id}")
async def voice_ws(ws: WebSocket, session_id: str, question_id: str):
    await ws.accept()
    print(f"[WS] Client connected: session={session_id}, question={question_id}")

    recognizer = KaldiRecognizer(MODEL, 16000)
    recognizer.SetWords(True)

    sessions.setdefault(session_id, {
        "audio": [],
        "raw_text": [],
        "questions": {}
    })

    chunk_count = 0
    total_bytes = 0

    try:
        while True:
            chunk = await ws.receive_bytes()
            chunk_count += 1
            total_bytes += len(chunk)
            
            # Debug logging every 10 chunks
            if chunk_count % 10 == 0:
                print(f"[WS] Received {chunk_count} chunks, {total_bytes} bytes total, last chunk: {len(chunk)} bytes")
            
            sessions[session_id]["audio"].append(chunk)

            result, is_final = transcribe_stream(chunk, recognizer)

            if is_final and "text" in result and result["text"].strip():
                print(f"[WS] Final transcript: '{result['text']}'")
                sessions[session_id]["raw_text"].append(result["text"])
                await ws.send_json({"final": result["text"]})
            else:
                partial = result.get("partial", "")
                if partial:  # Only log and send non-empty partials
                    print(f"[WS] Partial: '{partial}'")
                await ws.send_json({"partial": partial})

    except Exception as e:
        print(f"[WS] Connection closed: {e}")
        print(f"[WS] Total received: {chunk_count} chunks, {total_bytes} bytes")

@main.post("/submit_answer")
async def submit_answer(payload: dict):
    raw = payload["raw_transcript"]
    session_id = payload["session_id"]
    question_id = payload["question_id"]

    clean = clean_transcript(raw)

    sessions[session_id]["questions"][question_id] = {
        "raw": raw,
        "clean": clean
    }

    return {
        "clean_transcript": clean,
        "word_count": len(clean.split())
    }

@main.post("/analyze_session/{session_id}")
async def analyze_session(session_id: str):
    audio = sessions[session_id]["audio"]
    raw_text = " ".join(sessions[session_id]["raw_text"])

    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as f:
        for c in audio:
            f.write(c)
        webm = f.name

    wav = webm_to_wav(webm)

    metrics = analyze_audio(wav)

    words = raw_text.split()
    filler_count = sum(1 for w in words if w.lower() in FILLERS)
    wpm = len(words) / (metrics["duration"] / 60)

    conf = confidence_score(
        wpm,
        filler_count / max(len(words), 1),
        metrics["pause_ratio"],
        metrics["pitch_variation"]
    )

    return {
        "metrics": {
            "avg_wpm": round(wpm, 1),
            "filler_rate": round(filler_count / max(len(words), 1), 2),
            **metrics
        },
        "confidence_score": conf
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(main, host="0.0.0.0", port=8000)
