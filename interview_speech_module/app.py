from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from vosk import Model, KaldiRecognizer
from pydantic import BaseModel
import numpy as np
import json
import asyncio
import collections
import librosa
from typing import Dict, List, Optional

# =====================
# INIT
# =====================
app = FastAPI(title="Speech Analysis API")

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

model = Model("vosk-model-small-en-us-0.15")

# Session storage for accumulating metrics
sessions: Dict[str, Dict] = {}


class AnswerSubmission(BaseModel):
    session_id: str
    question_id: str
    raw_transcript: str


@app.get("/")
def home():
    return FileResponse("static/index.html")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "speech-analysis"}


# =====================
# REAL-TIME ANALYSIS
# =====================
def analyze_realtime(pcm_bytes, sr=16000):
    """Analyze audio chunk for real-time metrics."""
    y = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    if len(y) < sr:
        return None

    energy = float(np.mean(y**2))
    silence_ratio = float(np.sum(np.abs(y) < 0.02) / len(y))

    try:
        pitch = librosa.yin(y, fmin=80, fmax=300, sr=sr)
        pitch = pitch[~np.isnan(pitch)]
        pitch_var = float(np.std(pitch) / np.mean(pitch)) if len(pitch) > 10 else 0
    except:
        pitch_var = 0

    # Estimate filler words (crude heuristic based on energy patterns)
    filler_est = int(np.sum((np.abs(y) > 0.05) & (np.abs(y) < 0.15)) / sr)

    confidence = max(0, min(
        1,
        0.4*(1 - silence_ratio) +
        0.3*min(energy * 100, 1) +
        0.3*(1 - min(pitch_var, 1))
    ))

    return {
        "energy": round(energy, 4),
        "silence_ratio": round(silence_ratio, 3),
        "pitch_variation": round(pitch_var, 3),
        "filler_estimate": filler_est,
        "confidence_score": round(confidence, 2)
    }


# =====================
# LIVE WEBSOCKET
# =====================
@app.websocket("/ws/voice/{session_id}/{question_id}")
async def voice_ws(ws: WebSocket, session_id: str, question_id: str):
    """WebSocket endpoint for real-time speech processing."""
    await ws.accept()
    print(f"[Speech] Client connected: session={session_id}, question={question_id}")

    rec = KaldiRecognizer(model, 16000)
    rec.SetWords(True)

    pcm_buffer = collections.deque(maxlen=16000 * 5)  # 5 seconds rolling buffer
    last_analysis = asyncio.get_event_loop().time()
    
    # Initialize session if not exists
    if session_id not in sessions:
        sessions[session_id] = {
            "questions": {},
            "start_time": asyncio.get_event_loop().time(),
            "total_words": 0,
            "total_silence_ratio": 0,
            "total_pitch_var": 0,
            "total_filler_est": 0,
            "analysis_count": 0,
            "transcripts": {}
        }
    
    # Initialize question data
    sessions[session_id]["questions"][question_id] = {
        "transcript": "",
        "word_count": 0,
        "metrics": []
    }

    try:
        while True:
            pcm = await ws.receive_bytes()
            pcm_buffer.extend(pcm)

            # Live captions via Vosk
            if rec.AcceptWaveform(pcm):
                res = json.loads(rec.Result())
                if res.get("text"):
                    text = res["text"]
                    await ws.send_json({"final": text})
                    # Accumulate transcript
                    sessions[session_id]["questions"][question_id]["transcript"] += " " + text
                    sessions[session_id]["questions"][question_id]["word_count"] += len(text.split())
                    sessions[session_id]["total_words"] += len(text.split())
            else:
                part = json.loads(rec.PartialResult())
                if part.get("partial"):
                    await ws.send_json({"partial": part["partial"]})

            # Analysis every 2 seconds
            now = asyncio.get_event_loop().time()
            if now - last_analysis > 2:
                last_analysis = now
                metrics = analyze_realtime(bytes(pcm_buffer))
                if metrics:
                    await ws.send_json({"metrics": metrics})
                    # Accumulate metrics for session analysis
                    sessions[session_id]["questions"][question_id]["metrics"].append(metrics)
                    sessions[session_id]["total_silence_ratio"] += metrics["silence_ratio"]
                    sessions[session_id]["total_pitch_var"] += metrics["pitch_variation"]
                    sessions[session_id]["total_filler_est"] += metrics["filler_estimate"]
                    sessions[session_id]["analysis_count"] += 1

    except WebSocketDisconnect:
        print(f"[Speech] Client disconnected: session={session_id}")
    except Exception as e:
        print(f"[Speech] WebSocket error: {e}")
    finally:
        # Get final result from Vosk
        final = json.loads(rec.FinalResult())
        if final.get("text"):
            sessions[session_id]["questions"][question_id]["transcript"] += " " + final["text"]
            sessions[session_id]["questions"][question_id]["word_count"] += len(final["text"].split())
            sessions[session_id]["total_words"] += len(final["text"].split())
        print(f"[Speech] Session {session_id}, Question {question_id} ended")


@app.post("/submit_answer")
async def submit_answer(submission: AnswerSubmission):
    """Store an answer transcript for a session."""
    session_id = submission.session_id
    question_id = submission.question_id
    
    if session_id not in sessions:
        sessions[session_id] = {
            "questions": {},
            "start_time": asyncio.get_event_loop().time(),
            "total_words": 0,
            "total_silence_ratio": 0,
            "total_pitch_var": 0,
            "total_filler_est": 0,
            "analysis_count": 0,
            "transcripts": {}
        }
    
    sessions[session_id]["transcripts"][question_id] = submission.raw_transcript
    
    return {"status": "ok", "session_id": session_id, "question_id": question_id}


@app.post("/analyze_session/{session_id}")
async def analyze_session(session_id: str):
    """Get final analysis summary for a session."""
    if session_id not in sessions:
        return {
            "session_id": session_id,
            "confidence_score": 0,
            "metrics": {
                "avg_wpm": 0,
                "filler_rate": 0,
                "pause_ratio": 0,
                "pitch_variation": 0,
                "duration": 0
            },
            "error": "Session not found"
        }
    
    session = sessions[session_id]
    analysis_count = max(session.get("analysis_count", 1), 1)
    total_words = session.get("total_words", 0)
    
    # Calculate duration
    start_time = session.get("start_time", asyncio.get_event_loop().time())
    duration = asyncio.get_event_loop().time() - start_time
    duration = max(duration, 1)  # Avoid division by zero
    
    # Calculate average metrics
    avg_silence_ratio = session.get("total_silence_ratio", 0) / analysis_count
    avg_pitch_var = session.get("total_pitch_var", 0) / analysis_count
    avg_filler_est = session.get("total_filler_est", 0) / analysis_count
    
    # Calculate WPM (words per minute)
    avg_wpm = (total_words / duration) * 60 if duration > 0 else 0
    
    # Filler rate (estimated fillers per 100 words)
    filler_rate = (avg_filler_est / max(total_words, 1)) if total_words > 0 else 0
    
    # Calculate confidence score (0-1 scale)
    # Good WPM range: 120-180
    wpm_score = 1 - abs(avg_wpm - 150) / 150 if avg_wpm > 0 else 0.5
    wpm_score = max(0, min(1, wpm_score))
    
    confidence_score = (
        0.3 * (1 - avg_silence_ratio) +          # Less silence = better
        0.3 * (1 - min(avg_pitch_var, 1)) +      # Moderate variation = better
        0.2 * (1 - min(filler_rate, 0.2) / 0.2) + # Fewer fillers = better
        0.2 * wpm_score                           # Good WPM = better
    )
    confidence_score = max(0, min(1, confidence_score))
    
    return {
        "session_id": session_id,
        "confidence_score": round(confidence_score, 2),
        "metrics": {
            "avg_wpm": round(avg_wpm, 1),
            "filler_rate": round(filler_rate, 3),
            "pause_ratio": round(avg_silence_ratio, 3),
            "pitch_variation": round(avg_pitch_var, 3),
            "duration": round(duration, 1)
        },
        "total_words": total_words,
        "questions_answered": len(session.get("questions", {}))
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
