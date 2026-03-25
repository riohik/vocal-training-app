"use client";

import type { PitchData } from "@/types";

interface PitchDisplayProps {
  pitchData: PitchData | null;
}

export function PitchDisplay({ pitchData }: PitchDisplayProps) {
  const noteName = pitchData
    ? `${pitchData.noteName}${pitchData.octave}`
    : "--";
  const frequency = pitchData ? `${pitchData.frequency.toFixed(1)} Hz` : "-- Hz";
  const isSharp = pitchData?.noteName.includes("#") ?? false;

  return (
    <div className="text-center">
      <div
        className={`text-7xl font-extrabold leading-none transition-colors ${
          isSharp ? "text-warning" : "text-primary-light"
        }`}
      >
        {noteName}
      </div>
      <div className="mt-2 text-lg text-muted">{frequency}</div>
    </div>
  );
}
