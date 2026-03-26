"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AnalysisLoading() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-primary-light"
      >
        <Sparkles className="h-10 w-10" />
      </motion.div>
      <div className="text-center">
        <div className="font-bold">AI が分析中...</div>
        <div className="mt-1 text-sm text-muted">
          声質・安定性・改善ポイントを解析しています
        </div>
      </div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-primary-light"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              delay: i * 0.2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>
    </div>
  );
}
