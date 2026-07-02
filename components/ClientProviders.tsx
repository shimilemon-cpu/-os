"use client";

import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthGuard>{children}</AuthGuard>
      <BottomNav />
    </>
  );
}
