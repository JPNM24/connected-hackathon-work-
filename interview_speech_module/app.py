from fastapi import FastAPI, WebSocket, Request
import tempfile
import os
import wave
from speech_utils import *
from vosk import KaldiRecognizer

main = FastAPI()

sessions = {}

@main.websocket("/ws/voice/{session_id}/{question_id}")
async def voice_ws(ws: WebSocket, session_id: str, question_id: str):
    await ws.accept()

    recognizer = KaldiRecognizer(MODEL, 16000)
    recognizer.SetWords(True)

    sessions.setdefault(session_id, {
        "audio": [],
        "raw_text": [],
        "questions": {}
    })

    try:
        while True:
            chunk = await ws.receive_bytes()
            sessions[session_id]["audio"].append(chunk)

            result, is_final = transcribe_stream(chunk, recognizer)

            if is_final and "text" in result:
                sessions[session_id]["raw_text"].append(result["text"])
                await ws.send_json({"final": result["text"]})
            else:
                await ws.send_json({"partial": result.get("partial", "")})

    except:
        pass

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
