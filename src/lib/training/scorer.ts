import type { ScoreResult, ScoreRank } from "@/types";

/**
 * Convert cents deviation to a 0-100 score.
 */
export function centsToScore(cents: number): number {
  const abs = Math.abs(cents);
  if (abs <= 5) return 100;
  if (abs <= 10) return 90;
  if (abs <= 15) return 80;
  if (abs <= 20) return 70;
  if (abs <= 30) return 55;
  if (abs <= 40) return 40;
  if (abs <= 50) return 25;
  return 10;
}

/**
 * Calculate stability score from an array of frequencies against a target.
 * Converts to cents deviation to normalize across pitch ranges.
 * Lower standard deviation in cents = higher score.
 */
export function stabilityScore(
  pitchValues: number[],
  targetFreq: number,
): number {
  if (pitchValues.length < 2 || targetFreq <= 0) return 0;

  // Convert Hz to cents deviation from target
  const centsDeviations = pitchValues.map(
    (freq) => 1200 * Math.log2(freq / targetFreq),
  );

  const mean =
    centsDeviations.reduce((a, b) => a + b, 0) / centsDeviations.length;
  const variance =
    centsDeviations.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
    centsDeviations.length;
  const stdDev = Math.sqrt(variance);

  // Map stdDev to score: 0 cents stdDev = 100, 50+ cents stdDev = 0
  return Math.max(0, Math.round(100 - stdDev * 2));
}

/**
 * Calculate timing score based on how quickly the user hits the target pitch.
 * @param reactionMs - Time in ms to reach target pitch
 * @param targetMs - Expected time window
 */
export function timingScore(reactionMs: number, targetMs: number): number {
  const ratio = reactionMs / targetMs;
  if (ratio <= 0.1) return 100; // Hit it almost instantly
  if (ratio <= 0.2) return 90;
  if (ratio <= 0.3) return 80;
  if (ratio <= 0.5) return 60;
  if (ratio <= 0.7) return 40;
  return 20;
}

/**
 * Calculate endurance score based on sustain duration vs target.
 */
export function enduranceScore(
  sustainedMs: number,
  targetMs: number,
): number {
  const ratio = sustainedMs / targetMs;
  if (ratio >= 0.95) return 100;
  if (ratio >= 0.85) return 90;
  if (ratio >= 0.7) return 75;
  if (ratio >= 0.5) return 55;
  if (ratio >= 0.3) return 35;
  return 15;
}

/**
 * Calculate overall session score with weighted components.
 */
export function calculateSessionScore(components: {
  pitchAccuracy: number;
  stability: number;
  timing: number;
  endurance: number;
}): ScoreResult {
  const total = Math.round(
    components.pitchAccuracy * 0.4 +
      components.stability * 0.25 +
      components.timing * 0.2 +
      components.endurance * 0.15,
  );

  return {
    total,
    rank: scoreToRank(total),
    ...components,
  };
}

export function scoreToRank(score: number): ScoreRank {
  if (score >= 95) return "S";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function rankLabel(rank: ScoreRank): string {
  const labels: Record<ScoreRank, string> = {
    S: "Perfect!",
    A: "Great",
    B: "Good",
    C: "OK",
    D: "Try Again",
  };
  return labels[rank];
}

export function rankColor(rank: ScoreRank): string {
  const colors: Record<ScoreRank, string> = {
    S: "text-accent",
    A: "text-blue-400",
    B: "text-primary-light",
    C: "text-warning",
    D: "text-danger",
  };
  return colors[rank];
}
