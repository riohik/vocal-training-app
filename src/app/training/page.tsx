import Link from "next/link";

const EXERCISES = [
  {
    href: "/training/daily",
    icon: "🎯",
    title: "デイリートレーニング",
    desc: "カリキュラムに基づいた自動構成メニュー",
    time: "約10分",
  },
  {
    href: "/training/scale",
    icon: "🎹",
    title: "スケール練習",
    desc: "ドレミファソ...音階に合わせて音程を鍛える",
    time: "5-10分",
  },
  {
    href: "/training/long-tone",
    icon: "🎵",
    title: "ロングトーン",
    desc: "1つの音を安定して長くキープする",
    time: "3-5分",
  },
  {
    href: "/training/pitch-match",
    icon: "🎧",
    title: "ピッチマッチング",
    desc: "お手本の音を聴いて同じ音を出す",
    time: "5-10分",
  },
];

export default function TrainingPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">トレーニング</h1>
        <p className="mt-1 text-sm text-muted">
          練習したいメニューを選んでください
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {EXERCISES.map(({ href, icon, title, desc, time }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:scale-[1.01] active:scale-[0.99]"
          >
            <span className="text-3xl">{icon}</span>
            <div className="flex-1">
              <div className="font-semibold">{title}</div>
              <div className="text-sm text-muted">{desc}</div>
            </div>
            <div className="text-xs text-muted">{time}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
