"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { PitchDisplay } from "@/components/audio/PitchDisplay";
import { CentsMeter } from "@/components/audio/CentsMeter";
import { PianoKeyboard } from "@/components/audio/PianoKeyboard";
import { VolumeBar } from "@/components/audio/VolumeBar";
import { generateScale, getScaleForLevel } from "@/lib/training/scale-generator";
import { midiToFreq, midiToNoteName } from "@/lib/pitch/note-mapper";
import { playTone } from "@/lib/audio/tone-generator";
import type { TargetNote } from "@/types";

type SessionState = "idle" | "countdown" | "playing" | "finished";

export default function ScalePracticePage() {
  const { isListening, pitchData, rms, start, stop, error } =
    usePitchDetection();

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [level, setLevel] = useState(1);
  const [scale, setScale] = useState<TargetNote[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [scores, setScores] = useState<number[]>([]);
  const [noteStartTime, setNoteStartTime] = useState(0);

  const centsHistoryRef = useRef<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTarget = scale[currentNoteIndex] ?? null;

  // Score calculation for current note
  useEffect(() => {
    if (sessionState !== "playing" || !currentTarget || !pitchData) return;

    const targetMidi = currentTarget.midiNote;
    const detectedMidi = pitchData.midiNote;

    // Only score if we're on the right note (within 1 semitone)
    if (Math.abs(detectedMidi - targetMidi) <= 1) {
      centsHistoryRef.current.push(Math.abs(pitchData.cents));
    }
  }, [pitchData, sessionState, currentTarget]);

  // Advance to next note
  const advanceNote = useCallback(() => {
    // Calculate score for completed note
    const history = centsHistoryRef.current;
    if (history.length > 0) {
      const avgCents =
        history.reduce((a, b) => a + b, 0) / history.length;
      let score = 100;
      if (avgCents > 5) score = 90;
      if (avgCents > 10) score = 80;
      if (avgCents > 15) score = 70;
      if (avgCents > 20) score = 55;
      if (avgCents > 30) score = 40;
      if (avgCents > 40) score = 25;
      if (avgCents > 50) score = 10;
      setScores((prev) => [...prev, score]);
    } else {
      setScores((prev) => [...prev, 0]);
    }
    centsHistoryRef.current = [];

    setCurrentNoteIndex((prev) => {
      const next = prev + 1;
      if (next >= scale.length) {
        setSessionState("finished");
        stop();
        return prev;
      }
      // Play reference tone for next note
      const nextNote = scale[next];
      if (nextNote) {
        playTone(midiToFreq(nextNote.midiNote), 400, 0.2);
      }
      setNoteStartTime(Date.now());
      return next;
    });
  }, [scale, stop]);

  // Timer for each note
  useEffect(() => {
    if (sessionState !== "playing" || !currentTarget) return;

    timerRef.current = setTimeout(() => {
      advanceNote();
    }, currentTarget.durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sessionState, currentNoteIndex, currentTarget, advanceNote]);

  // Start session
  const startSession = async () => {
    const config = getScaleForLevel(level);
    const generatedScale = generateScale(
      config.rootMidi,
      config.scaleType,
      config.noteDurationMs,
    );
    setScale(generatedScale);
    setCurrentNoteIndex(0);
    setScores([]);
    centsHistoryRef.current = [];

    await start();
    setSessionState("countdown");
    setCountdown(3);

    // Countdown
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        setSessionState("playing");
        setNoteStartTime(Date.now());
        // Play first reference tone
        if (generatedScale[0]) {
          playTone(midiToFreq(generatedScale[0].midiNote), 400, 0.2);
        }
      }
    }, 1000);
  };

  const resetSession = () => {
    stop();
    setSessionState("idle");
    setScores([]);
    setCurrentNoteIndex(0);
    centsHistoryRef.current = [];
  };

  // Calculate final score
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const getRank = (score: number) => {
    if (score >= 95) return { rank: "S", label: "Perfect!", color: "text-accent" };
    if (score >= 85) return { rank: "A", label: "Great", color: "text-blue-400" };
    if (score >= 70) return { rank: "B", label: "Good", color: "text-primary-light" };
    if (score >= 50) return { rank: "C", label: "OK", color: "text-warning" };
    return { rank: "D", label: "Try Again", color: "text-danger" };
  };

  // Progress for current note
  const noteProgress = currentTarget
    ? Math.min(
        ((Date.now() - noteStartTime) / currentTarget.durationMs) * 100,
        100,
      )
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">スケール練習</h1>
        <p className="mt-1 text-sm text-muted">
          表示される音に合わせて歌いましょう
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
          {error}
        </div>
      )}

      {/* Idle State */}
      {sessionState === "idle" && (
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Level selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">レベル:</span>
            {[1, 2, 3].map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`h-10 w-10 rounded-full text-sm font-bold transition-all ${
                  level === l
                    ? "bg-primary text-white"
                    : "border border-border bg-card text-muted hover:border-primary/50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="text-center text-sm text-muted">
            {level === 1 && "3音（ド・レ・ミ）/ ゆっくり"}
            {level === 2 && "5音（ド〜ソ）/ 普通"}
            {level === 3 && "1オクターブ / 速め"}
          </div>
          <button
            onClick={startSession}
            className="rounded-full bg-gradient-to-r from-primary to-primary-light px-12 py-4 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95"
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
          <div className="mt-4 text-muted">準備してください...</div>
        </div>
      )}

      {/* Playing */}
      {sessionState === "playing" && currentTarget && (
        <div className="flex flex-col items-center gap-5">
          {/* Target note */}
          <div className="text-center">
            <div className="text-sm text-muted">ターゲット</div>
            <div className="text-4xl font-bold text-accent">
              {currentTarget.noteName}
              {currentTarget.octave}
            </div>
            {/* Progress bar for note duration */}
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-card">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-100"
                style={{ width: `${noteProgress}%` }}
              />
            </div>
            <div className="mt-1 text-xs text-muted">
              {currentNoteIndex + 1} / {scale.length}
            </div>
          </div>

          {/* Detected pitch */}
          <PitchDisplay pitchData={pitchData} />
          <CentsMeter pitchData={pitchData} />
          <PianoKeyboard
            activeMidi={pitchData?.midiNote ?? null}
          />
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
      {sessionState === "finished" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-center">
            <div className={`text-7xl font-extrabold ${getRank(averageScore).color}`}>
              {getRank(averageScore).rank}
            </div>
            <div className="mt-2 text-xl font-semibold">
              {getRank(averageScore).label}
            </div>
            <div className="mt-1 text-3xl font-bold text-primary-light">
              {averageScore}点
            </div>
          </div>

          {/* Score breakdown */}
          <div className="w-full max-w-xs space-y-2">
            {scale.map((note, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <span>
                  {midiToNoteName(note.midiNote)}
                </span>
                <span
                  className={
                    (scores[i] ?? 0) >= 80
                      ? "text-accent"
                      : (scores[i] ?? 0) >= 50
                        ? "text-warning"
                        : "text-danger"
                  }
                >
                  {scores[i] ?? 0}点
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
