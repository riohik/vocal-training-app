"""Voice analysis API endpoint for Vercel Serverless Functions."""

import base64
import io
import tempfile
from typing import Optional

import librosa
import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .advice_engine import generate_advice
from .voice_profile import (
    classify_voice_type,
    compute_breathiness,
    compute_brightness,
    compute_nasality,
)

app = FastAPI(title="VocalTrainer Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    audio: str  # base64 encoded WAV
    exerciseType: str = "scale"
    targetNotes: Optional[list[str]] = None


class VoiceProfile(BaseModel):
    type: str
    brightness: float
    breathiness: float
    nasality: float


class Analysis(BaseModel):
    mfccSummary: list[float]
    spectralCentroid: float
    breathPoints: list[float]
    stabilityScore: float


class Advice(BaseModel):
    strengths: list[str]
    improvements: list[str]
    nextExercise: str


class AnalyzeResponse(BaseModel):
    voiceProfile: VoiceProfile
    analysis: Analysis
    advice: Advice


def decode_audio(audio_b64: str) -> tuple[np.ndarray, int]:
    """Decode base64 audio to numpy array."""
    audio_bytes = base64.b64decode(audio_b64)
    buf = io.BytesIO(audio_bytes)

    try:
        y, sr = sf.read(buf)
    except Exception:
        # Try loading with librosa as fallback (handles more formats)
        buf.seek(0)
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=True) as f:
            f.write(audio_bytes)
            f.flush()
            y, sr = librosa.load(f.name, sr=22050, mono=True)
            return y, sr

    # Convert to mono if stereo
    if y.ndim > 1:
        y = np.mean(y, axis=1)

    return y.astype(np.float32), sr


def analyze_voice(y: np.ndarray, sr: int) -> dict:
    """Run full voice analysis pipeline."""
    # --- Pitch (F0) ---
    f0, voiced_flag, voiced_prob = librosa.pyin(
        y,
        fmin=librosa.note_to_hz("C2"),
        fmax=librosa.note_to_hz("C7"),
        sr=sr,
        hop_length=512,
    )

    # Filter to voiced frames
    f0_voiced = f0[voiced_flag & ~np.isnan(f0)]

    if len(f0_voiced) < 10:
        raise ValueError("音声が短すぎるか、声が検出されませんでした")

    f0_mean = float(np.mean(f0_voiced))
    f0_std = float(np.std(f0_voiced))

    # --- MFCC ---
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13, hop_length=512)
    mfcc_mean = np.mean(mfcc, axis=1)

    # --- Spectral Centroid ---
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)
    cent_mean = float(np.mean(cent))

    # --- HNR (approximated via spectral flatness) ---
    # True HNR requires specialized algorithm; use spectral flatness as proxy
    flatness = librosa.feature.spectral_flatness(y=y, hop_length=512)
    flatness_mean = float(np.mean(flatness))
    # Convert flatness to approximate HNR (dB)
    hnr_approx = float(-10 * np.log10(flatness_mean + 1e-10))

    # --- Breath Detection (RMS valleys) ---
    rms = librosa.feature.rms(y=y, hop_length=512)[0]
    times = librosa.times_like(rms, sr=sr, hop_length=512)

    breath_points = []
    if len(rms) > 10:
        threshold = float(np.mean(rms) * 0.3)
        in_silence = False
        for i, (t, r) in enumerate(zip(times, rms)):
            if r < threshold and not in_silence:
                in_silence = True
                breath_points.append(round(float(t), 2))
            elif r >= threshold:
                in_silence = False

    # --- Stability Score ---
    # Based on F0 standard deviation in cents
    if f0_mean > 0:
        cents_deviations = 1200 * np.log2(f0_voiced / f0_mean)
        cents_std = float(np.std(cents_deviations))
        stability = max(0, min(100, round(100 - cents_std * 2)))
    else:
        stability = 0

    return {
        "f0_mean": f0_mean,
        "f0_std": f0_std,
        "mfcc_mean": mfcc_mean.tolist(),
        "spectral_centroid": cent_mean,
        "hnr": hnr_approx,
        "breath_points": breath_points[:20],  # Limit to 20 points
        "stability_score": stability,
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """Analyze voice recording and return profile + advice."""
    try:
        y, sr = decode_audio(request.audio)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"音声データの読み込みに失敗しました: {str(e)}")

    try:
        result = analyze_voice(y, sr)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Voice profile
    voice_type = classify_voice_type(result["f0_mean"], result["spectral_centroid"])
    brightness = compute_brightness(result["spectral_centroid"])
    breathiness = compute_breathiness(result["hnr"])
    nasality = compute_nasality(np.array(result["mfcc_mean"]))

    # Advice
    advice = generate_advice(
        voice_type=voice_type,
        brightness=brightness,
        breathiness=breathiness,
        nasality=nasality,
        stability_score=result["stability_score"],
        f0_std=result["f0_std"],
        exercise_type=request.exerciseType,
    )

    return AnalyzeResponse(
        voiceProfile=VoiceProfile(
            type=voice_type,
            brightness=round(brightness, 2),
            breathiness=round(breathiness, 2),
            nasality=round(nasality, 2),
        ),
        analysis=Analysis(
            mfccSummary=[round(float(x), 3) for x in result["mfcc_mean"][:5]],
            spectralCentroid=round(result["spectral_centroid"], 1),
            breathPoints=result["breath_points"],
            stabilityScore=result["stability_score"],
        ),
        advice=Advice(**advice),
    )


# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok"}
