import type { Metadata, Viewport } from "next";
import { Noto_Serif_JP, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

// 記憶テキスト・見出し用の明朝体（古い写真・手紙の情緒）
const notoSerif = Noto_Serif_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-serif",
});

// UI 用のゴシック体
const notoSans = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CAPSULE — あの日に帰ろう",
  description: "音楽と記憶のタイムカプセルアプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CAPSULE",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0b0e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`h-full ${notoSerif.variable} ${notoSans.variable}`}>
      <body className="min-h-full bg-[#0e0b0e]">
        <div className="relative mx-auto max-w-sm min-h-screen">
          <ClientProviders>{children}</ClientProviders>
        </div>
        {/* フィルムグレイン（全画面に薄く重ねて古い写真の質感を出す） */}
        <div className="film-grain" aria-hidden="true" />
      </body>
    </html>
  );
}
