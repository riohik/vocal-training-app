/**
 * YIN-inspired Autocorrelation pitch detection.
 * Ported from PoC (poc/pitch-detection.html), verified working.
 */

export interface DetectionResult {
  freq: number;
  clarity: number;
  rms: number;
}

const MIN_FREQ = 70;
const MAX_FREQ = 1200;
const SILENCE_THRESHOLD = 0.01;
const YIN_THRESHOLD = 0.2;

export function detectPitch(
  buffer: Float32Array,
  sampleRate: number,
): DetectionResult {
  // Compute RMS for silence detection
  let rmsSum = 0;
  for (let i = 0; i < buffer.length; i++) {
    rmsSum += buffer[i] * buffer[i];
  }
  const rms = Math.sqrt(rmsSum / buffer.length);

  if (rms < SILENCE_THRESHOLD) {
    return { freq: -1, clarity: 0, rms };
  }

  const halfLen = Math.floor(buffer.length / 2);
  const diff = new Float32Array(halfLen);

  // Step 1: Difference function
  for (let tau = 0; tau < halfLen; tau++) {
    let sum = 0;
    for (let i = 0; i < halfLen; i++) {
      const d = buffer[i] - buffer[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Step 2: Cumulative mean normalized difference
  diff[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau < halfLen; tau++) {
    runningSum += diff[tau];
    diff[tau] = (diff[tau] * tau) / runningSum;
  }

  // Step 3: Absolute threshold
  let tauEstimate = -1;
  for (let tau = 2; tau < halfLen; tau++) {
    if (diff[tau] < YIN_THRESHOLD) {
      while (tau + 1 < halfLen && diff[tau + 1] < diff[tau]) {
        tau++;
      }
      tauEstimate = tau;
      break;
    }
  }

  // Fallback: global minimum
  if (tauEstimate === -1) {
    let minVal = Infinity;
    for (let tau = 2; tau < halfLen; tau++) {
      if (diff[tau] < minVal) {
        minVal = diff[tau];
        tauEstimate = tau;
      }
    }
    if (minVal > 0.5) {
      return { freq: -1, clarity: 0, rms };
    }
  }

  // Step 4: Parabolic interpolation
  let betterTau = tauEstimate;
  if (tauEstimate > 0 && tauEstimate < halfLen - 1) {
    const s0 = diff[tauEstimate - 1];
    const s1 = diff[tauEstimate];
    const s2 = diff[tauEstimate + 1];
    betterTau = tauEstimate + (s0 - s2) / (2 * (s0 - 2 * s1 + s2));
  }

  const freq = sampleRate / betterTau;
  const clarity = 1 - diff[tauEstimate];

  if (freq < MIN_FREQ || freq > MAX_FREQ) {
    return { freq: -1, clarity: 0, rms };
  }

  return { freq, clarity, rms };
}
