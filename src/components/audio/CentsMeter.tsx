import type { PitchData } from "@/types";

interface CentsMeterProps {
  pitchData: PitchData | null;
}

function getAccuracy(cents: number): {
  label: string;
  className: string;
} {
  const abs = Math.abs(cents);
  if (abs <= 5) return { label: "Perfect!", className: "bg-emerald-900 text-emerald-300" };
  if (abs <= 15) return { label: "Great", className: "bg-blue-900 text-blue-300" };
  if (abs <= 30) return { label: "Good", className: "bg-amber-900 text-amber-300" };
  return { label: "Off", className: "bg-red-900 text-red-300" };
}

export function CentsMeter({ pitchData }: CentsMeterProps) {
  const cents = pitchData?.cents ?? 0;
  const position = 50 + (cents / 50) * 50;
  const clampedPos = Math.max(5, Math.min(95, position));
  const accuracy = pitchData ? getAccuracy(cents) : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <span className="w-10 text-center text-sm text-muted">-50</span>
        <div className="relative h-6 w-72 overflow-hidden rounded-full border border-border bg-card">
          {/* Center line */}
          <div className="absolute top-0 bottom-0 left-1/2 z-10 w-0.5 bg-accent" />
          {/* Indicator */}
          <div
            className="absolute top-0.5 bottom-0.5 z-5 w-4 rounded-full bg-primary-light transition-[left] duration-50"
            style={{ left: `calc(${clampedPos}% - 8px)` }}
          />
        </div>
        <span className="w-10 text-center text-sm text-muted">+50</span>
      </div>

      {accuracy && (
        <span
          className={`rounded-full px-5 py-1 text-sm font-semibold ${accuracy.className}`}
        >
          {accuracy.label}
        </span>
      )}
    </div>
  );
}
