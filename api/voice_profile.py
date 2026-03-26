"""Voice profile classification using acoustic features."""

import numpy as np


def classify_voice_type(f0_mean: float, spectral_centroid: float) -> str:
    """
    Classify voice type based on average F0 and spectral centroid.
    MVP: rule-based. Post-MVP: ML model.
    """
    if f0_mean > 250:
        return "soprano" if spectral_centroid > 2000 else "mezzo-soprano"
    elif f0_mean > 180:
        return "tenor" if spectral_centroid > 1800 else "alto"
    elif f0_mean > 130:
        return "baritone" if spectral_centroid > 1500 else "bass-baritone"
    else:
        return "bass"


def compute_brightness(spectral_centroid: float) -> float:
    """Map spectral centroid to 0-1 brightness score."""
    # Typical voice centroid range: 500-4000 Hz
    return float(np.clip((spectral_centroid - 500) / 3500, 0, 1))


def compute_breathiness(hnr: float) -> float:
    """
    Map Harmonics-to-Noise Ratio to 0-1 breathiness score.
    Lower HNR = more breathy.
    HNR range: typically 0-40 dB for voice.
    """
    # HNR < 10 = very breathy, HNR > 30 = very clear
    return float(np.clip(1 - (hnr - 5) / 30, 0, 1))


def compute_nasality(mfcc: np.ndarray) -> float:
    """
    Estimate nasality from MFCC coefficients.
    Nasal sounds have energy concentrated around 250-300 Hz
    and reduced higher formant energy.
    MVP: simplified using MFCC ratios.
    """
    if len(mfcc) < 5:
        return 0.5
    # Higher ratio of low MFCCs to high MFCCs suggests nasality
    low_energy = float(np.mean(np.abs(mfcc[:3])))
    high_energy = float(np.mean(np.abs(mfcc[5:10]))) if len(mfcc) > 10 else float(np.mean(np.abs(mfcc[3:])))
    if high_energy == 0:
        return 0.5
    ratio = low_energy / (high_energy + 1e-6)
    return float(np.clip(ratio / 5, 0, 1))
