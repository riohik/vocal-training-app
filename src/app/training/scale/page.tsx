"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePitchDetection } from "@/hooks/usePitchDetection";
import { PitchDisplay } from "@/components/audio/PitchDisplay";
import { CentsMeter } from "@/components/audio/CentsMeter";
import { PianoKeyboard } from "@/components/audio/PianoKeyboard";
import { VolumeBar } from "@/components/audio/VolumeBar";
import { ScoreDisplay } from "@/components/training/ScoreDisplay";
import { generateScale, getScaleForLevel } from "@/lib/training/scale-generator";
import { centsToScore, scoreToRank, rankLabel, rankColor } from "@/lib/training/scorer";
import { midiToFreq, midiToNoteName } from "@/lib/pitch/note-mapper";
import { playTone } from "@/lib/audio/tone-generator";
import type { TargetNote } from "@/types";

type SessionState = "idle" | "countdown" | "playing" | "finished";

export default function ScalePracticePage() {
  const { pitchData, rms, start, stop, error } = usePitchDetection();

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [level, setLevel] = useState(1);
  const [scale, setScale] = useState<TargetNote[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [scores, setScores] = useState<number[]>([]);
  const [noteProgress, setNoteProgress] = useState(0);

  const centsHistoryRef = useRef<number[]>([]);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteStartTimeRef = useRef(0);

  const currentTarget = scale[currentNoteIndex] ?? null;

  // Score calculation for current note - use target-relative cents
  useEffect(() => {
    if (sessionState !== "playing" || !currentTarget || !pitchData) return;
    if (pitchData.frequency <= 0) return;

    const targetFreq = midiToFreq(currentTarget.midiNote);
    const targetCents = Math.abs(
      1200 * Math.log2(pitchData.frequency / targetFreq),
    );

    // Only score if within reasonable range (< 100 cents = 1 semitone)
    if (targetCents < 100) {
      centsHistoryRef.current.push(targetCents);
    }
  }, [pitchData, sessionState, currentTarget]);

  // Progress timer - updates independently of pitch detection
  useEffect(() => {
    if (sessionState !== "playing" || !currentTarget) return;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - noteStartTimeRef.current;
      setNoteProgress(
        Math.min((elapsed / currentTarget.durationMs) * 100, 100),
      );
    }, 50);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [sessionState, currentNoteIndex, currentTarget]);

  // Advance to next note - side effects extracted from setState updater
  const advanceNote = useCallback(() => {
    // Calculate score for completed note using centsToScore
    const history = centsHistoryRef.current;
    if (history.length > 0) {
      const avgCents = history.reduce((a, b) => a + b, 0) / history.length;
      setScores((prev) => [...prev, centsToScore(avgCents)]);
    } else {
      setScores((prev) => [...prev, 0]);
    }
    centsHistoryRef.current = [];

    const nextIndex = currentNoteIndex + 1;
    if (nextIndex >= scale.length) {
      // Session complete
      setSessionState("finished");
      stop();
      return;
    }

    // Advance to next note
    setCurrentNoteIndex(nextIndex);
    noteStartTimeRef.current = Date.now();

    // Play reference tone for next note
    const nextNote = scale[nextIndex];
    if (nextNote) {
      playTone(midiToFreq(nextNote.midiNote), 400, 0.2);
    }
  }, [scale, stop, currentNoteIndex]);

  // Timer for each note duration
  useEffect(() => {
    if (sessionState !== "playing" || !currentTarget) return;

    noteTimerRef.current = setTimeout(() => {
      advanceNote();
    }, currentTarget.durationMs);

    return () => {
      if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    };
  }, [sessionState, currentNoteIndex, currentTarget, advanceNote]);

  const clearAllTimers = useCallback(() => {
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    noteTimerRef.current = null;
    countdownIntervalRef.current = null;
    progressIntervalRef.current = null;
  }, []);

  // Start session
  const startSession = async () => {
    clearAllTimers();

    const config = getScaleForLevel(level);
    const generatedScale = generateScale(
      config.rootMidi,
      config.scaleType,
      config.noteDurationMs,
    );
    setScale(generatedScale);
    setCurrentNoteIndex(0);
    setScores([]);
    setNoteProgress(0);
    centsHistoryRef.current = [];

    await start();
    setSessionState("countdown");
    setCountdown(3);

    // Countdown with ref-tracked interval
    let count = 3;
    countdownIntervalRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setSessionState("playing");
        noteStartTimeRef.current = Date.now();
        // Play first reference tone
        if (generatedScale[0]) {
          playTone(midiToFreq(generatedScale[0].midiNote), 400, 0.2);
        }
      }
    }, 1000);
  };

  const resetSession = useCallback(() => {
    clearAllTimers();
    stop();
    setSessionState("idle");
    setScores([]);
    setCurrentNoteIndex(0);
    centsHistoryRef.current = [];
  }, [clearAllTimers, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Calculate final score
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const rank = scoreToRank(averageScore);

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
            className="rounded-full bg-linear-to-r from-primary to-primary-light px-12 py-4 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95"
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
      {sessionState === "finished" && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-center">
            <div className={`text-7xl font-extrabold ${rankColor(rank)}`}>
              {rank}
            </div>
            <div className="mt-2 text-xl font-semibold">
              {rankLabel(rank)}
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
                <span>{midiToNoteName(note.midiNote)}</span>
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
