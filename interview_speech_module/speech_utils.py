import subprocess
import librosa
import numpy as np
import parselmouth
import wave
import json
from vosk import Model, KaldiRecognizer

MODEL = Model("vosk-model-small-en-us-0.15")

FILLERS = {"uh", "um", "ah", "er", "hmm"}

def webm_to_wav(webm_path):
    wav_path = webm_path.replace(".webm", ".wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", webm_path, "-ar", "16000", "-ac", "1", wav_path],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    return wav_path

def transcribe_stream(chunk_bytes, recognizer):
    if recognizer.AcceptWaveform(chunk_bytes):
        return json.loads(recognizer.Result()), True
    else:
        return json.loads(recognizer.PartialResult()), False

def clean_transcript(text):
    return " ".join(w for w in text.split() if w.lower() not in FILLERS)

def analyze_audio(wav_path):
    y, sr = librosa.load(wav_path, sr=16000)

    duration = librosa.get_duration(y=y, sr=sr)
    rms = np.mean(librosa.feature.rms(y=y))

    intervals = librosa.effects.split(y, top_db=25)
    speech_time = sum((e - s) / sr for s, e in intervals)
    pause_time = max(duration - speech_time, 0)

    snd = parselmouth.Sound(wav_path)
    pitch = snd.to_pitch()
    vals = pitch.selected_array["frequency"]
    vals = vals[vals > 0]

    pitch_mean = float(np.mean(vals)) if len(vals) else 0
    pitch_var = float(np.std(vals) / np.mean(vals)) if len(vals) else 0

    return {
        "duration": duration,
        "energy": rms,
        "pause_ratio": pause_time / duration if duration else 0,
        "pitch_mean": pitch_mean,
        "pitch_variation": pitch_var
    }

def confidence_score(wpm, filler_rate, pause_ratio, pitch_var):
    score = (
        0.35 * min(wpm / 160, 1) +
        0.25 * (1 - filler_rate) +
        0.2 * (1 - pause_ratio) +
        0.2 * (1 - pitch_var)
    )
    return round(max(min(score, 1), 0), 2)
