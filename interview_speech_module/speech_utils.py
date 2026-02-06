import subprocess
import json
import librosa
import numpy as np
import parselmouth
from vosk import Model, KaldiRecognizer
import wave

model = Model("vosk-model-small-en-us-0.15")

def convert_to_wav(input_path):
    output_path = input_path.replace(".webm", ".wav")
    command = ["ffmpeg", "-y", "-i", input_path, "-ar", "16000", "-ac", "1", output_path]
    subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_path

def transcribe_vosk(wav_path):
    wf = wave.open(wav_path, "rb")
    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(True)

    results=[]
    while True:
        data = wf.readframes(4000)
        if len(data)==0:
            break
        if rec.AcceptWaveform(data):
            results.append(json.loads(rec.Result()))
    results.append(json.loads(rec.FinalResult()))

    text = " ".join(r.get("text","") for r in results)
    words=[]
    for r in results:
        if "result" in r:
            words.extend(r["result"])
    return text, words

def analyze_energy(y):
    rms = librosa.feature.rms(y=y)[0]
    return float(np.mean(rms))

def analyze_pauses(y, sr):
    intervals = librosa.effects.split(y, top_db=25)
    silence = len(y)/sr
    speech = sum((end-start)/sr for start,end in intervals)
    return max(silence - speech, 0)

def analyze_pitch(wav_path):
    snd = parselmouth.Sound(wav_path)
    pitch = snd.to_pitch()
    values = pitch.selected_array['frequency']
    values = values[values>0]
    return float(np.mean(values)), float(np.std(values)/np.mean(values))

def confidence_score(wpm, pause_ratio, pitch_var, energy):
    return round(max(min(0.4*(wpm/160)+0.3*energy-0.2*pause_ratio-0.1*pitch_var,1),0),2)
