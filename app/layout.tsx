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
  title: "大喜利Pocket",
  description: "AIがあなたたちだけの笑いを覚える大喜利アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "大喜利Pocket",
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1410",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 描画前に保存済みテーマを適用してチラつきを防ぐ
const themeScript = `(function(){try{var t=localStorage.getItem('capsule_theme');if(t==='wine'||t==='sepia'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" data-theme="sepia" className={`h-full ${notoSerif.variable} ${notoSans.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-[var(--bg)]">
        <div className="relative mx-auto max-w-sm min-h-screen">
          <ClientProviders>{children}</ClientProviders>
        </div>
        {/* 周辺減光とフィルムグレインを全画面に薄く重ねて、古い写真の情緒を出す */}
        <div className="vignette" aria-hidden="true" />
        <div className="film-grain" aria-hidden="true" />
      </body>
    </html>
  );
}
