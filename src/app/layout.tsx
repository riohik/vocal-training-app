import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Navigation } from "@/components/ui/Navigation";
import { MotionProvider } from "@/components/ui/MotionProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "VocalTrainer - AI ボイストレーニング",
  description:
    "ブラウザで使えるAIボイストレーニングアプリ。リアルタイム音程検出とAI音声分析で、あなたの歌唱力を向上させます。",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#121218",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${outfit.variable} h-full antialiased`}>
      <body
        className="flex min-h-full flex-col bg-background text-foreground"
        style={{ fontFamily: "var(--font-outfit), system-ui, sans-serif" }}
      >
        <MotionProvider>
          <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-20 pt-6">
            {children}
          </main>
          <Navigation />
        </MotionProvider>
      </body>
    </html>
  );
}
