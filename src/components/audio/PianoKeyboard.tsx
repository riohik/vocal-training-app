"use client";

import { useMemo } from "react";

interface PianoKeyboardProps {
  activeMidi: number | null;
  startMidi?: number;
  endMidi?: number;
}

const WHITE_NOTES = [0, 2, 4, 5, 7, 9, 11];
const BLACK_NOTES = [1, 3, 6, 8, 10];
const WHITE_KEY_WIDTH = 28;
const BLACK_KEY_WIDTH = 18;

export function PianoKeyboard({
  activeMidi,
  startMidi = 48,
  endMidi = 84,
}: PianoKeyboardProps) {
  const keys = useMemo(() => {
    const whites: { midi: number; x: number }[] = [];
    const blacks: { midi: number; x: number }[] = [];
    let whiteIndex = 0;

    for (let midi = startMidi; midi < endMidi; midi++) {
      const noteInOctave = midi % 12;
      if (WHITE_NOTES.includes(noteInOctave)) {
        whites.push({ midi, x: whiteIndex * WHITE_KEY_WIDTH });
        whiteIndex++;
      }
    }

    let wIdx = 0;
    for (let midi = startMidi; midi < endMidi; midi++) {
      const noteInOctave = midi % 12;
      if (WHITE_NOTES.includes(noteInOctave)) {
        wIdx++;
      }
      if (BLACK_NOTES.includes(noteInOctave) && wIdx > 0) {
        const prevWhiteX = whites[wIdx - 1]?.x ?? 0;
        blacks.push({
          midi,
          x: prevWhiteX + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2,
        });
      }
    }

    return { whites, blacks, totalWidth: whiteIndex * WHITE_KEY_WIDTH };
  }, [startMidi, endMidi]);

  return (
    <div className="overflow-x-auto px-2">
      <div
        className="relative mx-auto"
        style={{ width: keys.totalWidth, height: 100 }}
      >
        {/* White keys */}
        {keys.whites.map(({ midi, x }) => (
          <div
            key={`w-${midi}`}
            className={`absolute top-0 rounded-b border border-zinc-400 transition-colors ${
              activeMidi === midi
                ? "bg-gradient-to-b from-primary-light to-primary"
                : "bg-zinc-200"
            }`}
            style={{ left: x, width: WHITE_KEY_WIDTH, height: 100 }}
          />
        ))}
        {/* Black keys */}
        {keys.blacks.map(({ midi, x }) => (
          <div
            key={`b-${midi}`}
            className={`absolute top-0 z-10 rounded-b border border-zinc-900 transition-colors ${
              activeMidi === midi
                ? "bg-gradient-to-b from-violet-300 to-primary-light"
                : "bg-zinc-800"
            }`}
            style={{ left: x, width: BLACK_KEY_WIDTH, height: 64 }}
          />
        ))}
      </div>
    </div>
  );
}
