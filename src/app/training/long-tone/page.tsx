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
  enduranceScore,
  calculateSessionScore,
} from "@/lib/training/scorer";
import { midiToFreq, midiToNoteName } from "@/lib/pitch/note-mapper";
import { playTone } from "@/lib/audio/tone-generator";
import type { ScoreResult } from "@/types";

type SessionState = "idle" | "countdown" | "playing" | "finished";

const TARGET_NOTES = [
  { midi: 60, label: "C4" },
  { midi: 64, label: "E4" },
  { midi: 67, label: "G4" },
  { midi: 72, label: "C5" },
];

const DURATIONS = [
  { seconds: 5, label: "5秒" },
  { seconds: 8, label: "8秒" },
  { seconds: 12, label: "12秒" },
];

export default function LongTonePage() {
  const { isListening, pitchData, rms, start, stop, error } =
    usePitchDetection();

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [selectedNote, setSelectedNote] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  const centsHistoryRef = useRef<number[]>([]);
  const pitchHistoryRef = useRef<number[]>([]);
  const totalMsRef = useRef(0);
  const matchingMsRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const startTimeRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const targetMidi = TARGET_NOTES[selectedNote].midi;
  const targetFreq = midiToFreq(targetMidi);
  const targetDuration = DURATIONS[selectedDuration].seconds;

  // Track pitch during playing - use millisecond-based measurement
  useEffect(() => {
    if (sessionState !== "playing") return;

    const now = performance.now();
    if (lastTimestampRef.current > 0) {
      const delta = now - lastTimestampRef.current;
      totalMsRef.current += delta;

      if (pitchData && pitchData.frequency > 0) {
        // Compute cents deviation relative to target note
        const targetCents = Math.abs(
          1200 * Math.log2(pitchData.frequency / targetFreq),
        );
        if (targetCents < 100) {
          // Within reasonable range of target
          centsHistoryRef.current.push(targetCents);
          pitchHistoryRef.current.push(pitchData.frequency);
          matchingMsRef.current += delta;
        }
      }
    }
    lastTimestampRef.current = now;
  }, [pitchData, sessionState, targetFreq]);

  // Elapsed timer
  useEffect(() => {
    if (sessionState !== "playing") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const sec = (now - startTimeRef.current) / 1000;
      setElapsed(sec);

      if (sec >= targetDuration) {
        clearInterval(interval);
        finishSession();
      }
    }, 100);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState, targetDuration]);

  const finishSession = useCallback(() => {
    stop();
    setSessionState("finished");

    const cents = centsHistoryRef.current;
    const pitches = pitchHistoryRef.current;
    const totalMs = totalMsRef.current;
    const matchingMs = matchingMsRef.current;

    const avgCentsScore =
      cents.length > 0
        ? Math.round(
            cents.reduce((a, c) => a + centsToScore(c), 0) / cents.length,
          )
        : 0;

    const stability = stabilityScore(pitches, targetFreq);
    const endurance = enduranceScore(
      totalMs > 0 ? matchingMs : 0,
      targetDuration * 1000,
    );

    const result = calculateSessionScore({
      pitchAccuracy: avgCentsScore,
      stability,
      timing: 80, // Not really applicable for long tone
      endurance,
    });

    setScoreResult(result);
  }, [stop, targetDuration, targetFreq]);

  const startSession = async () => {
    centsHistoryRef.current = [];
    pitchHistoryRef.current = [];
    totalMsRef.current = 0;
    matchingMsRef.current = 0;
    lastTimestampRef.current = 0;
    setElapsed(0);
    setScoreResult(null);

    await start();
    setSessionState("countdown");
    setCountdown(3);

    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        // Play reference tone
        playTone(midiToFreq(targetMidi), 600, 0.25);
        startTimeRef.current = Date.now();
        setSessionState("playing");
      }
    }, 1000);
  };

  const resetSession = () => {
    stop();
    setSessionState("idle");
    setScoreResult(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const progressPercent = Math.min((elapsed / targetDuration) * 100, 100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">ロングトーン</h1>
        <p className="mt-1 text-sm text-muted">
          1つの音を安定してキープしましょう
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
          {/* Note selector */}
          <div>
            <div className="mb-2 text-center text-sm text-muted">ターゲット音</div>
            <div className="flex gap-3">
              {TARGET_NOTES.map((note, i) => (
                <button
                  key={note.midi}
                  onClick={() => {
                    setSelectedNote(i);
                    playTone(midiToFreq(note.midi), 400, 0.2);
                  }}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    selectedNote === i
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-muted hover:border-primary/50"
                  }`}
                >
                  {note.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration selector */}
          <div>
            <div className="mb-2 text-center text-sm text-muted">目標時間</div>
            <div className="flex gap-3">
              {DURATIONS.map((dur, i) => (
                <button
                  key={dur.seconds}
                  onClick={() => setSelectedDuration(i)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                    selectedDuration === i
                      ? "bg-primary text-white"
                      : "border border-border bg-card text-muted hover:border-primary/50"
                  }`}
                >
                  {dur.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startSession}
            className="mt-2 rounded-full bg-gradient-to-r from-primary to-primary-light px-12 py-4 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95"
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
          <div className="mt-4 text-muted">
            {midiToNoteName(targetMidi)} を {targetDuration}秒キープ
          </div>
        </div>
      )}

      {/* Playing */}
      {sessionState === "playing" && (
        <div className="flex flex-col items-center gap-5">
          {/* Target */}
          <div className="text-center">
            <div className="text-sm text-muted">ターゲット</div>
            <div className="text-4xl font-bold text-accent">
              {midiToNoteName(targetMidi)}
            </div>
          </div>

          {/* Timer ring */}
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="absolute h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="45"
                fill="none" stroke="var(--color-border)" strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="45"
                fill="none" stroke="var(--color-accent)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${progressPercent * 2.83} 283`}
                className="transition-[stroke-dasharray] duration-100"
              />
            </svg>
            <div className="text-2xl font-bold">
              {Math.max(0, targetDuration - elapsed).toFixed(1)}s
            </div>
          </div>

          <PitchDisplay pitchData={pitchData} />
          <CentsMeter pitchData={pitchData} />
          <PianoKeyboard activeMidi={pitchData?.midiNote ?? null} />
          <VolumeBar rms={rms} />

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

          <div className="flex gap-4">
            <button
              onClick={resetSession}
              className="rounded-full border border-border px-6 py-3 font-semibold transition-all hover:border-primary/50"
            >
              メニューに戻る
            </button>
            <button
              onClick={startSession}
              className="rounded-full bg-gradient-to-r from-primary to-primary-light px-6 py-3 font-semibold text-white transition-all hover:scale-105"
            >
              もう一度
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
