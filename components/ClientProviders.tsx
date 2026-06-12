"use client";

import dynamic from "next/dynamic";

const AuthGuard = dynamic(() => import("@/components/AuthGuard"), { ssr: false });
const BottomNav = dynamic(() => import("@/components/BottomNav"), { ssr: false });

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthGuard>{children}</AuthGuard>
      <BottomNav />
    </>
  );
}
