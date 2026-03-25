"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { detectPitch } from "@/lib/pitch/detector";
import { freqToNote } from "@/lib/pitch/note-mapper";
import type { PitchData } from "@/types";

interface UsePitchDetectionReturn {
  isListening: boolean;
  pitchData: PitchData | null;
  rms: number;
  start: () => Promise<void>;
  stop: () => void;
  error: string | null;
}

export function usePitchDetection(): UsePitchDetectionReturn {
  const [isListening, setIsListening] = useState(false);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [rms, setRms] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const isListeningRef = useRef(false);

  const processAudio = useCallback(() => {
    if (!isListeningRef.current || !analyserRef.current || !audioCtxRef.current)
      return;

    const analyser = analyserRef.current;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    const result = detectPitch(buffer, audioCtxRef.current.sampleRate);
    setRms(result.rms);

    if (result.freq > 0 && result.clarity > 0.5) {
      const note = freqToNote(result.freq);
      setPitchData({
        frequency: result.freq,
        clarity: result.clarity,
        rms: result.rms,
        ...note,
        timestamp: performance.now(),
      });
    } else {
      setPitchData(null);
    }

    rafRef.current = requestAnimationFrame(processAudio);
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 4096;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      isListeningRef.current = true;
      setIsListening(true);

      rafRef.current = requestAnimationFrame(processAudio);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "マイクへのアクセスが拒否されました",
      );
    }
  }, [processAudio]);

  const stop = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    cancelAnimationFrame(rafRef.current);

    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();

    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setPitchData(null);
    setRms(0);
  }, []);

  useEffect(() => {
    return () => {
      if (isListeningRef.current) {
        stop();
      }
    };
  }, [stop]);

  return { isListening, pitchData, rms, start, stop, error };
}
