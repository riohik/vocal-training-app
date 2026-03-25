"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mic, Music, Timer, Headphones } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Exercise {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  time: string;
  iconBg: string;
  iconColor: string;
}

const EXERCISES: Exercise[] = [
  {
    href: "/training/daily",
    icon: Mic,
    title: "デイリートレーニング",
    desc: "カリキュラムに基づいた自動構成メニュー",
    time: "約10分",
    iconBg: "bg-linear-to-br from-primary to-pink",
    iconColor: "text-white",
  },
  {
    href: "/training/scale",
    icon: Music,
    title: "スケール練習",
    desc: "ドレミファソ...音階に合わせて音程を鍛える",
    time: "5-10分",
    iconBg: "bg-primary/20",
    iconColor: "text-primary-light",
  },
  {
    href: "/training/long-tone",
    icon: Timer,
    title: "ロングトーン",
    desc: "1つの音を安定して長くキープする",
    time: "3-5分",
    iconBg: "bg-accent/20",
    iconColor: "text-accent-bright",
  },
  {
    href: "/training/pitch-match",
    icon: Headphones,
    title: "ピッチマッチング",
    desc: "お手本の音を聴いて同じ音を出す",
    time: "5-10分",
    iconBg: "bg-cyan/20",
    iconColor: "text-cyan",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function TrainingPage() {
  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold">トレーニング</h1>
        <p className="mt-1 text-sm text-muted">
          練習したいメニューを選んでください
        </p>
      </motion.div>

      <div className="flex flex-col gap-3">
        {EXERCISES.map(({ href, icon: Icon, title, desc, time, iconBg, iconColor }) => (
          <motion.div key={href} variants={fadeUp}>
            <Link href={href}>
              <motion.div
                className="group flex items-center gap-4 rounded-2xl border border-border/50 bg-card/80 p-4 transition-colors hover:bg-elevated/60"
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{title}</div>
                  <div className="text-xs text-muted truncate">{desc}</div>
                </div>
                <div className="rounded-full bg-elevated px-2.5 py-1 text-[10px] font-semibold text-muted">
                  {time}
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
