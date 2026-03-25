import type { ScoreResult } from "@/types";
import { rankLabel, rankColor } from "@/lib/training/scorer";

interface ScoreDisplayProps {
  result: ScoreResult;
}

export function ScoreDisplay({ result }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Rank & Total */}
      <div className="text-center">
        <div className={`text-7xl font-extrabold ${rankColor(result.rank)}`}>
          {result.rank}
        </div>
        <div className="mt-1 text-xl font-semibold">
          {rankLabel(result.rank)}
        </div>
        <div className="mt-1 text-3xl font-bold text-primary-light">
          {result.total}点
        </div>
      </div>

      {/* Breakdown */}
      <div className="w-full max-w-xs space-y-3">
        <ScoreBar label="ピッチ精度" value={result.pitchAccuracy} weight="40%" />
        <ScoreBar label="安定性" value={result.stability} weight="25%" />
        <ScoreBar label="タイミング" value={result.timing} weight="20%" />
        <ScoreBar label="持続力" value={result.endurance} weight="15%" />
      </div>
    </div>
  );
}

function ScoreBar({
  label,
  value,
  weight,
}: {
  label: string;
  value: number;
  weight: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  const barColor =
    clamped >= 80
      ? "bg-accent"
      : clamped >= 60
        ? "bg-primary-light"
        : clamped >= 40
          ? "bg-warning"
          : "bg-danger";

  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted">
          {label} <span className="text-[10px]">({weight})</span>
        </span>
        <span className="font-semibold">{clamped}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-card">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
