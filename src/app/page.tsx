"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mic, Music, Timer, Headphones, BarChart3, Flame, ChevronRight, Sparkles } from "lucide-react";

// Bouncing waveform bars
const WAVEFORM_HEIGHTS = [24, 36, 48, 40, 28, 44, 56, 48, 32, 52, 40, 28, 48, 36, 56, 44];

function WaveformVisual() {
  const colors = [
    "bg-primary",
    "bg-pink",
    "bg-cyan",
    "bg-accent",
    "bg-yellow",
    "bg-primary-light",
    "bg-pink",
    "bg-cyan",
    "bg-accent",
    "bg-primary",
    "bg-yellow",
    "bg-pink",
    "bg-cyan",
    "bg-accent",
    "bg-primary-light",
    "bg-yellow",
  ];

  return (
    <div className="flex items-end justify-center gap-1 h-14">
      {WAVEFORM_HEIGHTS.map((height, i) => (
        <motion.div
          key={i}
          className={`w-2 rounded-full ${colors[i]} opacity-80`}
          initial={{ scaleY: 0.3 }}
          animate={{ scaleY: [0.3, 1, 0.5, 0.9, 0.3] }}
          transition={{
            duration: 1.8,
            delay: i * 0.06,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
          style={{ height, transformOrigin: "bottom" }}
        />
      ))}
    </div>
  );
}

const STAT_CARDS = [
  {
    value: "0",
    label: "連続日数",
    icon: Flame,
    bg: "bg-orange/15",
    iconBg: "bg-orange/20",
    color: "text-orange",
    border: "border-orange/20",
  },
  {
    value: "--",
    label: "前回スコア",
    icon: Sparkles,
    bg: "bg-accent/15",
    iconBg: "bg-accent/20",
    color: "text-accent-bright",
    border: "border-accent/20",
  },
  {
    value: "--",
    label: "音域",
    icon: BarChart3,
    bg: "bg-cyan/15",
    iconBg: "bg-cyan/20",
    color: "text-cyan",
    border: "border-cyan/20",
  },
];

const TRAINING_MENU = [
  {
    href: "/training/scale",
    icon: Music,
    title: "スケール",
    desc: "音階トレーニング",
    bg: "bg-primary/12",
    iconBg: "bg-primary/25",
    iconColor: "text-primary-light",
  },
  {
    href: "/training/long-tone",
    icon: Timer,
    title: "ロングトーン",
    desc: "安定キープ",
    bg: "bg-accent/12",
    iconBg: "bg-accent/25",
    iconColor: "text-accent-bright",
  },
  {
    href: "/training/pitch-match",
    icon: Headphones,
    title: "ピッチマッチ",
    desc: "お手本に合わせる",
    bg: "bg-cyan/12",
    iconBg: "bg-cyan/25",
    iconColor: "text-cyan",
  },
  {
    href: "/vocal-range",
    icon: BarChart3,
    title: "音域テスト",
    desc: "音域を測定",
    bg: "bg-pink/12",
    iconBg: "bg-pink/25",
    iconColor: "text-pink",
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

const popIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
};

export default function HomePage() {
  return (
    <motion.div
      className="flex flex-col gap-7"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Hero */}
      <motion.div variants={fadeUp} className="text-center pt-2">
        <motion.div
          className="inline-block text-4xl font-extrabold tracking-tight"
          whileHover={{ scale: 1.02 }}
        >
          <span className="bg-linear-to-r from-primary-light via-pink to-cyan bg-clip-text text-transparent">
            VocalTrainer
          </span>
        </motion.div>
        <p className="mt-1 text-sm font-medium text-muted">
          歌がうまくなる、毎日の10分
        </p>
        <div className="mt-5">
          <WaveformVisual />
        </div>
      </motion.div>

      {/* Daily CTA */}
      <motion.div variants={fadeUp}>
        <Link href="/training/daily" className="group block">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-linear-to-r from-primary via-pink to-cyan p-[2px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
          >
            <div className="flex items-center gap-4 rounded-2xl bg-card/95 px-5 py-4 backdrop-blur-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-pink text-white">
                <Mic className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold">
                  デイリートレーニング
                </div>
                <div className="text-xs text-muted">
                  今日のメニュー · 約10分
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted group-hover:text-primary-light transition-colors" />
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
        {STAT_CARDS.map(({ value, label, icon: Icon, bg, iconBg, color, border }) => (
          <motion.div
            key={label}
            variants={popIn}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border ${border} ${bg} p-3.5`}
            whileHover={{ y: -2 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className={`text-xl font-extrabold ${color}`}>{value}</div>
            <div className="text-[10px] font-medium text-muted">{label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Training Menu */}
      <motion.div variants={fadeUp}>
        <h2 className="mb-3 text-sm font-bold text-muted">
          トレーニング
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {TRAINING_MENU.map(({ href, icon: Icon, title, desc, bg, iconBg, iconColor }) => (
            <motion.div
              key={href}
              variants={popIn}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
            >
              <Link
                href={href}
                className={`group flex flex-col gap-3 rounded-2xl border border-border/50 ${bg} p-4`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <div className="text-sm font-bold">{title}</div>
                  <div className="text-[11px] text-muted">{desc}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
