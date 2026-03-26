"use client";

import { motion } from "framer-motion";
import { User, Sun, Wind, Volume2 } from "lucide-react";
import type { VoiceProfile } from "@/types";

const VOICE_TYPE_LABELS: Record<string, string> = {
  soprano: "ソプラノ",
  "mezzo-soprano": "メゾソプラノ",
  alto: "アルト",
  tenor: "テノール",
  baritone: "バリトン",
  "bass-baritone": "バスバリトン",
  bass: "バス",
};

interface VoiceProfileCardProps {
  profile: VoiceProfile;
}

export function VoiceProfileCard({ profile }: VoiceProfileCardProps) {
  const typeLabel = VOICE_TYPE_LABELS[profile.type] || profile.type;

  return (
    <motion.div
      className="rounded-2xl border border-primary/20 bg-primary/8 p-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, ease: "easeOut" as const }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary-light">
          <User className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted">あなたの声質</div>
          <div className="text-lg font-bold text-primary-light">{typeLabel}</div>
        </div>
      </div>

      <div className="space-y-3">
        <ProfileBar
          icon={<Sun className="h-3.5 w-3.5" />}
          label="明るさ"
          value={profile.brightness}
          color="bg-yellow"
          low="暗い"
          high="明るい"
        />
        <ProfileBar
          icon={<Wind className="h-3.5 w-3.5" />}
          label="息漏れ"
          value={profile.breathiness}
          color="bg-cyan"
          low="クリア"
          high="ブレシー"
        />
        <ProfileBar
          icon={<Volume2 className="h-3.5 w-3.5" />}
          label="鼻声度"
          value={profile.nasality}
          color="bg-pink"
          low="通常"
          high="鼻声"
        />
      </div>
    </motion.div>
  );
}

function ProfileBar({
  icon,
  label,
  value,
  color,
  low,
  high,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  low: string;
  high: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted">
          {icon} {label}
        </span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-card">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" as const }}
        />
      </div>
      <div className="mt-0.5 flex justify-between text-[9px] text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}
