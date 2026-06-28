import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

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
  themeColor: "#0d0d0d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-ink font-body">
        <div className="relative mx-auto max-w-sm min-h-screen">
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
