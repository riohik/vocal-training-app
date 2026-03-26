"use client";

import { motion } from "framer-motion";
import { ThumbsUp, AlertCircle, ArrowRight } from "lucide-react";

interface AdviceCardProps {
  advice: {
    strengths: string[];
    improvements: string[];
    nextExercise: string;
  };
}

export function AdviceCard({ advice }: AdviceCardProps) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, ease: "easeOut" as const }}
    >
      {/* Strengths */}
      <div className="rounded-2xl border border-accent/20 bg-accent/8 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-accent-bright">
          <ThumbsUp className="h-4 w-4" />
          良かった点
        </div>
        <ul className="space-y-1.5">
          {advice.strengths.map((s, i) => (
            <li key={i} className="text-sm text-foreground/80">
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Improvements */}
      <div className="rounded-2xl border border-orange/20 bg-orange/8 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-orange">
          <AlertCircle className="h-4 w-4" />
          改善ポイント
        </div>
        <ul className="space-y-1.5">
          {advice.improvements.map((s, i) => (
            <li key={i} className="text-sm text-foreground/80">
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Next Exercise */}
      <div className="rounded-2xl border border-cyan/20 bg-cyan/8 p-4">
        <div className="mb-1 flex items-center gap-2 text-sm font-bold text-cyan">
          <ArrowRight className="h-4 w-4" />
          次のおすすめ
        </div>
        <p className="text-sm text-foreground/80">{advice.nextExercise}</p>
      </div>
    </motion.div>
  );
}
