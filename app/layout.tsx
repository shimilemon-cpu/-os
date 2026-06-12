import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

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
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-[#0e0b0e]">
        <div className="relative mx-auto max-w-sm min-h-screen">
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
