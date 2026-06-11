import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "CAPSULE — あの日に帰ろう",
  description: "音楽と記憶のタイムカプセルアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-[#0e0b0e]">
        {/* Mobile-first max-width container */}
        <div className="relative mx-auto max-w-sm min-h-screen">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
