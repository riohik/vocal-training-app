import type { NoteInfo } from "@/types";

const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F",
  "F#", "G", "G#", "A", "A#", "B",
] as const;

const A4_FREQ = 440;

export function freqToNote(freq: number): NoteInfo {
  const semitones = 12 * Math.log2(freq / A4_FREQ);
  const roundedSemitones = Math.round(semitones);
  const midiNote = roundedSemitones + 69;
  const cents = Math.round((semitones - roundedSemitones) * 100);
  const noteName = NOTE_NAMES[((midiNote % 12) + 12) % 12];
  const octave = Math.floor(midiNote / 12) - 1;

  return { noteName, octave, cents, midiNote };
}

export function midiToNoteName(midi: number): string {
  const noteName = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName}${octave}`;
}

export function noteToFreq(noteName: string, octave: number): number {
  const noteIndex = NOTE_NAMES.indexOf(noteName as typeof NOTE_NAMES[number]);
  if (noteIndex === -1) return 0;
  const midiNote = (octave + 1) * 12 + noteIndex;
  return A4_FREQ * Math.pow(2, (midiNote - 69) / 12);
}

export function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - 69) / 12);
}

export { NOTE_NAMES };
