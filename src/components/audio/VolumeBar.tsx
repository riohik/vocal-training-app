interface VolumeBarProps {
  rms: number;
}

export function VolumeBar({ rms }: VolumeBarProps) {
  const volume = Math.min(rms * 5, 1) * 100;

  return (
    <div className="w-full">
      <div className="mb-1 text-xs text-muted">音量</div>
      <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-card">
        <div
          className="h-full rounded-full bg-linear-to-r from-accent via-warning to-danger transition-[width] duration-50"
          style={{ width: `${volume}%` }}
        />
      </div>
    </div>
  );
}
