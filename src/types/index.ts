// ===== Note & Pitch =====

export interface PitchData {
  frequency: number;
  clarity: number;
  rms: number;
  noteName: string;
  octave: number;
  cents: number;
  midiNote: number;
  timestamp: number;
}

export interface NoteInfo {
  noteName: string;
  octave: number;
  cents: number;
  midiNote: number;
}

// ===== Training =====

export type ExerciseType = "scale" | "long-tone" | "pitch-match" | "daily";

export interface TargetNote {
  noteName: string;
  octave: number;
  midiNote: number;
  durationMs: number;
}

export interface ExerciseResult {
  name: string;
  score: number;
  targetNotes: string[];
  detectedNotes: string[];
  centsDeviation: number[];
}

export interface TrainingSession {
  id: string;
  date: string;
  type: ExerciseType;
  duration: number;
  score: number;
  details: {
    pitchAccuracy: number;
    stability: number;
    timing: number;
    endurance: number;
  };
  level: number;
  exercises: ExerciseResult[];
  aiAnalysis?: AIAnalysisResult;
}

// ===== Scoring =====

export type ScoreRank = "S" | "A" | "B" | "C" | "D";

export interface ScoreResult {
  total: number;
  rank: ScoreRank;
  pitchAccuracy: number;
  stability: number;
  timing: number;
  endurance: number;
}

// ===== AI Analysis =====

export interface VoiceProfile {
  type: string;
  brightness: number;
  breathiness: number;
  nasality: number;
}

export interface AIAnalysisResult {
  voiceProfile: VoiceProfile;
  analysis: {
    spectralCentroid: number;
    breathPoints: number[];
    stabilityScore: number;
  };
  advice: {
    strengths: string[];
    improvements: string[];
    nextExercise: string;
  };
  analyzedAt: string;
}

// ===== Settings =====

export interface UserSettings {
  displayName: string;
  level: number;
  dailyGoalMinutes: number;
  theme: "light" | "dark";
}

export interface VocalRangeResult {
  date: string;
  lowestNote: string;
  highestNote: string;
  lowestMidi: number;
  highestMidi: number;
}
