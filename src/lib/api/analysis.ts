import type { AIAnalysisResult } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function analyzeVoice(
  audioBlob: Blob,
  exerciseType: string,
  targetNotes?: string[],
): Promise<AIAnalysisResult> {
  const audioBase64 = await blobToBase64(audioBlob);

  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio: audioBase64,
      exerciseType,
      targetNotes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.detail || `分析に失敗しました (${response.status})`,
    );
  }

  const data = await response.json();

  return {
    voiceProfile: data.voiceProfile,
    analysis: data.analysis,
    advice: data.advice,
    analyzedAt: new Date().toISOString(),
  };
}
