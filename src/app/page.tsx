import Link from "next/link";

const MENU_ITEMS = [
  {
    href: "/training/daily",
    icon: "🎯",
    title: "デイリートレーニング",
    desc: "今日のメニューを自動構成（約10分）",
    primary: true,
  },
  {
    href: "/training/scale",
    icon: "🎹",
    title: "スケール練習",
    desc: "ドレミに合わせて音程を鍛える",
  },
  {
    href: "/training/long-tone",
    icon: "🎵",
    title: "ロングトーン",
    desc: "1音を安定してキープする練習",
  },
  {
    href: "/training/pitch-match",
    icon: "🎧",
    title: "ピッチマッチング",
    desc: "お手本の音に合わせて歌う",
  },
  {
    href: "/vocal-range",
    icon: "📊",
    title: "音域テスト",
    desc: "あなたの音域を測定する",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary-light">
          VocalTrainer
        </h1>
        <p className="mt-1 text-sm text-muted">
          AI ボイストレーニング
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-primary-light">0</div>
          <div className="text-xs text-muted">連続日数</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-accent">--</div>
          <div className="text-xs text-muted">前回スコア</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-warning">--</div>
          <div className="text-xs text-muted">音域</div>
        </div>
      </div>

      {/* Training Menu */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">トレーニング</h2>
        {MENU_ITEMS.map(({ href, icon, title, desc, primary }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${
              primary
                ? "border-primary/40 bg-primary/10 hover:border-primary/60"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <span className="text-3xl">{icon}</span>
            <div>
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-muted">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
