import type { TargetNote } from "@/types";
import { midiToNoteName } from "@/lib/pitch/note-mapper";

// Scale patterns (semitone intervals from root)
const SCALES = {
  "3-note": [0, 2, 4], // C D E
  "5-note": [0, 2, 4, 5, 7], // C D E F G
  "octave": [0, 2, 4, 5, 7, 9, 11, 12], // C D E F G A B C
} as const;

export type ScaleType = keyof typeof SCALES;

export function generateScale(
  rootMidi: number,
  scaleType: ScaleType,
  noteDurationMs: number = 2000,
): TargetNote[] {
  const intervals = SCALES[scaleType];

  // Ascending
  const ascending: TargetNote[] = intervals.map((interval) => {
    const midi = rootMidi + interval;
    const name = midiToNoteName(midi);
    return {
      noteName: name.replace(/\d+$/, ""),
      octave: parseInt(name.match(/\d+$/)?.[0] ?? "4"),
      midiNote: midi,
      durationMs: noteDurationMs,
    };
  });

  // Descending (skip the top note to avoid repeat)
  const descending = [...ascending].reverse().slice(1);

  return [...ascending, ...descending];
}

export function getScaleForLevel(level: number): {
  scaleType: ScaleType;
  rootMidi: number;
  noteDurationMs: number;
} {
  switch (level) {
    case 1:
      return { scaleType: "3-note", rootMidi: 60, noteDurationMs: 3000 }; // C4, slow
    case 2:
      return { scaleType: "5-note", rootMidi: 60, noteDurationMs: 2000 }; // C4
    case 3:
      return { scaleType: "octave", rootMidi: 60, noteDurationMs: 1500 }; // C4
    default:
      return { scaleType: "5-note", rootMidi: 60, noteDurationMs: 2000 };
  }
}
