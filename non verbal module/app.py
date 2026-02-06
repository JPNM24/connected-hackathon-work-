"""
FastAPI backend for non-verbal analysis.
Processes video frames via WebSocket and returns real-time analysis scores.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import base64
import cv2
import numpy as np
import sys
import os

# Add the src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from non_verbal_analysis.analyzer import NonVerbalAnalyzer

app = FastAPI(title="Non-Verbal Analysis API")

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the analyzer
analyzer = NonVerbalAnalyzer()

# Store session data for final analysis
sessions = {}


def decode_frame(base64_data: str) -> np.ndarray:
    """Decode base64 image data to numpy array."""
    try:
        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decode base64
        img_bytes = base64.b64decode(base64_data)
        
        # Convert to numpy array
        nparr = np.frombuffer(img_bytes, np.uint8)
        
        # Decode image
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return frame
    except Exception as e:
        print(f"[NonVerbal] Error decoding frame: {e}")
        return None


@app.websocket("/ws/video/{session_id}")
async def video_ws(ws: WebSocket, session_id: str):
    """WebSocket endpoint for real-time video frame processing."""
    await ws.accept()
    print(f"[NonVerbal] Client connected: session={session_id}")
    
    # Initialize session storage
    sessions[session_id] = {
        "frame_count": 0,
        "scores_history": [],
        "last_valid_scores": None
    }
    
    try:
        while True:
            # Receive base64-encoded frame
            data = await ws.receive_text()
            
            # Decode frame
            frame = decode_frame(data)
            
            if frame is None:
                await ws.send_json({
                    "status": "error",
                    "message": "Failed to decode frame"
                })
                continue
            
            sessions[session_id]["frame_count"] += 1
            
            # Process frame through analyzer
            result = analyzer.process_frame(session_id, frame)
            
            # Store valid scores
            if isinstance(result, dict) and result.get("session_status") == "active":
                scores = result.get("non_verbal_scores", {})
                if scores.get("final_non_verbal_score") is not None:
                    sessions[session_id]["scores_history"].append(scores)
                    sessions[session_id]["last_valid_scores"] = scores
            
            # Send result back to client
            await ws.send_json(result)
            
            # Log periodically
            if sessions[session_id]["frame_count"] % 30 == 0:
                print(f"[NonVerbal] Session {session_id}: {sessions[session_id]['frame_count']} frames processed")
    
    except WebSocketDisconnect:
        print(f"[NonVerbal] Client disconnected: session={session_id}")
    except Exception as e:
        print(f"[NonVerbal] Error in WebSocket: {e}")
    finally:
        print(f"[NonVerbal] Session {session_id} ended with {sessions.get(session_id, {}).get('frame_count', 0)} frames")


@app.post("/analyze_session/{session_id}")
async def analyze_session(session_id: str):
    """Get final analysis summary for a session."""
    if session_id not in sessions:
        return {"error": "Session not found"}
    
    session_data = sessions[session_id]
    scores_history = session_data.get("scores_history", [])
    
    if not scores_history:
        return {
            "session_id": session_id,
            "total_frames": session_data.get("frame_count", 0),
            "non_verbal_scores": {
                "eye_contact": None,
                "facial_expression": None,
                "posture": None,
                "stability": None,
                "final_non_verbal_score": None
            },
            "pass_status": "insufficient_data"
        }
    
    # Calculate average scores
    avg_eye_contact = np.mean([s.get("eye_contact", 0) or 0 for s in scores_history])
    avg_expression = np.mean([s.get("facial_expression", 0) or 0 for s in scores_history])
    avg_posture = np.mean([s.get("posture", 0) or 0 for s in scores_history])
    avg_stability = np.mean([s.get("stability", 0) or 0 for s in scores_history])
    avg_final = np.mean([s.get("final_non_verbal_score", 0) or 0 for s in scores_history])
    
    # Determine pass/fail (threshold: 60)
    pass_status = "pass" if avg_final >= 60 else "fail"
    
    return {
        "session_id": session_id,
        "total_frames": session_data.get("frame_count", 0),
        "analyzed_frames": len(scores_history),
        "non_verbal_scores": {
            "eye_contact": round(avg_eye_contact, 2),
            "facial_expression": round(avg_expression, 2),
            "posture": round(avg_posture, 2),
            "stability": round(avg_stability, 2),
            "final_non_verbal_score": round(avg_final, 2)
        },
        "pass_status": pass_status,
        "pass_threshold": 60
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "non-verbal-analysis"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
