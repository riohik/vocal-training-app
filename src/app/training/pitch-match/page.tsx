"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { PitchDisplay } from "@/components/audio/PitchDisplay";
import { CentsMeter } from "@/components/audio/CentsMeter";
import { PianoKeyboard } from "@/components/audio/PianoKeyboard";
import { VolumeBar } from "@/components/audio/VolumeBar";
import { ScoreDisplay } from "@/components/training/ScoreDisplay";
import {
  centsToScore,
  stabilityScore,
  timingScore,
  enduranceScore,
  calculateSessionScore,
} from "@/lib/training/scorer";
import { midiToFreq, midiToNoteName } from "@/lib/pitch/note-mapper";
import { playTone } from "@/lib/audio/tone-generator";
import type { ScoreResult } from "@/types";

type SessionState = "idle" | "countdown" | "listening" | "singing" | "finished";

interface Round {
  targetMidi: number;
  listenDurationMs: number;
  singDurationMs: number;
}

const LEVELS = [
  {
    label: "かんたん（3音）",
    noteCount: 3,
    singDuration: 3000,
    pool: [60, 62, 64, 65, 67], // C4-G4 white keys
  },
  {
    label: "ふつう（5音）",
    noteCount: 5,
    singDuration: 2500,
    pool: [60, 62, 64, 65, 67, 69, 71, 72], // C4-C5
  },
  {
    label: "むずかしい（7音）",
    noteCount: 7,
    singDuration: 2000,
    pool: [57, 59, 60, 62, 64, 65, 67, 69, 71, 72], // A3-C5
  },
];

function generateRounds(levelIndex: number): Round[] {
  const level = LEVELS[levelIndex];
  const rounds: Round[] = [];
  const pool = [...level.pool];

  for (let i = 0; i < level.noteCount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    rounds.push({
      targetMidi: pool[idx],
      listenDurationMs: 800,
      singDurationMs: level.singDuration,
    });
  }
  return rounds;
}

export default function PitchMatchPage() {
  const { isListening, pitchData, rms, start, stop, error } =
    usePitchDetection();

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [level, setLevel] = useState(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [phase, setPhase] = useState<"listen" | "sing">("listen");

  const centsRef = useRef<number[]>([]);
  const pitchesRef = useRef<number[]>([]);
  const hitTimeRef = useRef<number | null>(null);
  const roundStartRef = useRef(0);
  const sustainedRef = useRef(0);
  const totalRef = useRef(0);

  const current = rounds[currentRound] ?? null;

  // Track pitch while singing
  useEffect(() => {
    if (sessionState !== "singing" || !current) return;

    totalRef.current++;

    if (pitchData && Math.abs(pitchData.midiNote - current.targetMidi) <= 1) {
      centsRef.current.push(Math.abs(pitchData.cents));
      pitchesRef.current.push(pitchData.frequency);
      sustainedRef.current++;

      // Record first hit time
      if (hitTimeRef.current === null) {
        hitTimeRef.current = Date.now() - roundStartRef.current;
      }
    }
  }, [pitchData, sessionState, current]);

  const finishRound = useCallback(() => {
    const cents = centsRef.current;
    const score =
      cents.length > 0
        ? Math.round(
            cents.reduce((a, c) => a + centsToScore(c), 0) / cents.length,
          )
        : 0;

    setRoundScores((prev) => [...prev, score]);

    // Reset refs
    centsRef.current = [];
    pitchesRef.current = [];
    hitTimeRef.current = null;
    sustainedRef.current = 0;
    totalRef.current = 0;

    const nextRound = currentRound + 1;
    if (nextRound >= rounds.length) {
      // All rounds done
      setSessionState("finished");
      stop();
      return;
    }

    setCurrentRound(nextRound);
    setPhase("listen");
    setSessionState("listening");

    // Play next reference tone after a brief pause
    setTimeout(() => {
      const nextTarget = rounds[nextRound];
      if (nextTarget) {
        playTone(midiToFreq(nextTarget.targetMidi), 600, 0.3);
        // Switch to singing after listen duration
        setTimeout(() => {
          setPhase("sing");
          setSessionState("singing");
          roundStartRef.current = Date.now();
          // Auto-finish after sing duration
          setTimeout(() => {
            finishRound();
          }, nextTarget.singDurationMs);
        }, nextTarget.listenDurationMs + 200);
      }
    }, 500);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRound, rounds, stop]);

  // Calculate final score when finished
  useEffect(() => {
    if (sessionState !== "finished" || roundScores.length === 0) return;

    const avgPitch =
      roundScores.reduce((a, b) => a + b, 0) / roundScores.length;

    const result = calculateSessionScore({
      pitchAccuracy: Math.round(avgPitch),
      stability: 75, // Simplified for pitch match
      timing: 70,
      endurance: 80,
    });

    setScoreResult(result);
  }, [sessionState, roundScores]);

  const startSession = async () => {
    const generatedRounds = generateRounds(level);
    setRounds(generatedRounds);
    setCurrentRound(0);
    setRoundScores([]);
    setScoreResult(null);
    centsRef.current = [];
    pitchesRef.current = [];
    hitTimeRef.current = null;
    sustainedRef.current = 0;
    totalRef.current = 0;

    await start();

    // Countdown
    setSessionState("countdown");
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);

        // Start first round: listen phase
        setPhase("listen");
        setSessionState("listening");
        const first = generatedRounds[0];
        if (first) {
          playTone(midiToFreq(first.targetMidi), 600, 0.3);
          setTimeout(() => {
            setPhase("sing");
            setSessionState("singing");
            roundStartRef.current = Date.now();
            setTimeout(() => {
              finishRound();
            }, first.singDurationMs);
          }, first.listenDurationMs + 200);
        }
      }
    }, 1000);
  };

  const resetSession = () => {
    stop();
    setSessionState("idle");
    setScoreResult(null);
    setRoundScores([]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">ピッチマッチング</h1>
        <p className="mt-1 text-sm text-muted">
          お手本の音を聴いて、同じ音を出しましょう
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Idle */}
      {sessionState === "idle" && (
        <div className="flex flex-col items-center gap-6 py-6">
          <div>
            <div className="mb-2 text-center text-sm text-muted">レベル</div>
            <div className="flex flex-col gap-2">
              {LEVELS.map((l, i) => (
                <button
                  key={i}
                  onClick={() => setLevel(i)}
                  className={`rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                    level === i
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-muted hover:border-primary/50"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="mt-2 rounded-full bg-linear-to-r from-primary to-primary-light px-12 py-4 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95"
          >
            スタート
          </button>
        </div>
      )}

      {/* Countdown */}
      {sessionState === "countdown" && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-8xl font-extrabold text-primary-light animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {/* Listening / Singing */}
      {(sessionState === "listening" || sessionState === "singing") &&
        current && (
          <div className="flex flex-col items-center gap-5">
            {/* Phase indicator */}
            <div
              className={`rounded-full px-6 py-2 text-sm font-bold ${
                phase === "listen"
                  ? "bg-blue-900 text-blue-300"
                  : "bg-emerald-900 text-emerald-300"
              }`}
            >
              {phase === "listen" ? "🎧 聴いてください" : "🎤 歌ってください"}
            </div>

            {/* Target */}
            <div className="text-center">
              <div className="text-sm text-muted">
                ラウンド {currentRound + 1} / {rounds.length}
              </div>
              <div className="text-4xl font-bold text-accent">
                {midiToNoteName(current.targetMidi)}
              </div>
            </div>

            {/* Show pitch detection only during singing */}
            {phase === "sing" && (
              <>
                <PitchDisplay pitchData={pitchData} />
                <CentsMeter pitchData={pitchData} />
              </>
            )}

            <PianoKeyboard
              activeMidi={
                phase === "listen"
                  ? current.targetMidi
                  : (pitchData?.midiNote ?? null)
              }
            />
            {phase === "sing" && <VolumeBar rms={rms} />}

            {/* Round scores so far */}
            {roundScores.length > 0 && (
              <div className="flex gap-2">
                {roundScores.map((s, i) => (
                  <div
                    key={i}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      s >= 80
                        ? "bg-emerald-900 text-emerald-300"
                        : s >= 50
                          ? "bg-amber-900 text-amber-300"
                          : "bg-red-900 text-red-300"
                    }`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={resetSession}
              className="mt-2 rounded-full border border-border px-6 py-2 text-sm text-muted hover:border-danger hover:text-danger"
            >
              中止
            </button>
          </div>
        )}

      {/* Finished */}
      {sessionState === "finished" && scoreResult && (
        <div className="flex flex-col items-center gap-6 py-6">
          <ScoreDisplay result={scoreResult} />

          {/* Per-round breakdown */}
          <div className="w-full max-w-xs space-y-2">
            {rounds.map((round, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <span>{midiToNoteName(round.targetMidi)}</span>
                <span
                  className={
                    (roundScores[i] ?? 0) >= 80
                      ? "text-accent"
                      : (roundScores[i] ?? 0) >= 50
                        ? "text-warning"
                        : "text-danger"
                  }
                >
                  {roundScores[i] ?? 0}点
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetSession}
              className="rounded-full border border-border px-6 py-3 font-semibold transition-all hover:border-primary/50"
            >
              メニューに戻る
            </button>
            <button
              onClick={startSession}
              className="rounded-full bg-linear-to-r from-primary to-primary-light px-6 py-3 font-semibold text-white transition-all hover:scale-105"
            >
              もう一度
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
