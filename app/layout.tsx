import type { Metadata, Viewport } from "next";
import { Shippori_Mincho_B1, Zen_Kaku_Gothic_New, Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const mincho = Shippori_Mincho_B1({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-mincho",
});

const kaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-kaku",
});

const maru = Zen_Maru_Gothic({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-maru-nf",
});

export const metadata: Metadata = {
  title: "大喜利Pocket",
  description: "AIがあなたたちだけの笑いを覚える大喜利アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "大喜利Pocket",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF7EC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`h-full ${mincho.variable} ${kaku.variable} ${maru.variable}`}>
      <body className="min-h-full bg-ink font-body text-text">
        <div className="relative mx-auto max-w-sm min-h-screen">
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
