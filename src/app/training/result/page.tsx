"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ScoreDisplay } from "@/components/training/ScoreDisplay";
import { VoiceProfileCard } from "@/components/analysis/VoiceProfileCard";
import { AdviceCard } from "@/components/analysis/AdviceCard";
import { AnalysisLoading } from "@/components/analysis/AnalysisLoading";
import { analyzeVoice } from "@/lib/api/analysis";
import type { ScoreResult, AIAnalysisResult } from "@/types";

export default function ResultPage() {
  return (
    <Suspense fallback={<AnalysisLoading />}>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const searchParams = useSearchParams();
  const exerciseType = searchParams.get("type") || "scale";

  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load score and audio from sessionStorage on mount
  useEffect(() => {
    const scoreJson = sessionStorage.getItem("lastScore");
    if (scoreJson) {
      try {
        setScoreResult(JSON.parse(scoreJson));
      } catch {
        // ignore
      }
    }

    const audioB64 = sessionStorage.getItem("lastAudioB64");
    if (audioB64) {
      setAnalyzing(true);
      // Convert base64 back to blob for the API
      const byteChars = atob(audioB64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "audio/webm" });

      analyzeVoice(blob, exerciseType)
        .then((result) => {
          setAiResult(result);
          setAnalyzing(false);
          // Clean up
          sessionStorage.removeItem("lastAudioB64");
        })
        .catch((err) => {
          setError(err.message);
          setAnalyzing(false);
        });
    }
  }, [exerciseType]);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      className="flex flex-col gap-6"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <Link
          href="/training"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold">セッション結果</h1>
      </motion.div>

      {/* Score */}
      {scoreResult && (
        <motion.div variants={fadeUp}>
          <ScoreDisplay result={scoreResult} />
        </motion.div>
      )}

      {/* AI Analysis */}
      {analyzing && (
        <motion.div variants={fadeUp}>
          <AnalysisLoading />
        </motion.div>
      )}

      {error && (
        <motion.div variants={fadeUp}>
          <div className="rounded-xl border border-orange/20 bg-orange/8 p-4 text-sm">
            <div className="font-bold text-orange">AI分析に失敗しました</div>
            <div className="mt-1 text-muted">{error}</div>
            <div className="mt-2 text-xs text-muted">
              スコアは正常に記録されています。AI分析はサーバーへの接続が必要です。
            </div>
          </div>
        </motion.div>
      )}

      {aiResult && (
        <>
          <motion.div variants={fadeUp}>
            <h2 className="mb-3 text-sm font-bold text-muted">AI 声質分析</h2>
            <VoiceProfileCard profile={aiResult.voiceProfile} />
          </motion.div>

          <motion.div variants={fadeUp}>
            <h2 className="mb-3 text-sm font-bold text-muted">アドバイス</h2>
            <AdviceCard advice={aiResult.advice} />
          </motion.div>
        </>
      )}

      {/* Actions */}
      <motion.div variants={fadeUp} className="flex gap-3 pb-4">
        <Link
          href="/training"
          className="flex-1 rounded-xl border border-border bg-card py-3 text-center text-sm font-bold transition-colors hover:bg-elevated"
        >
          メニューに戻る
        </Link>
        <Link
          href={`/training/${exerciseType}`}
          className="flex-1 rounded-xl bg-linear-to-r from-primary to-pink py-3 text-center text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          もう一度
        </Link>
      </motion.div>
    </motion.div>
  );
}
