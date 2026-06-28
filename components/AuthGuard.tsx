"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  const isPublic = pathname.startsWith("/auth");

  useEffect(() => {
    if (isPublic) {
      setReady(true);
      return;
    }

    // cancelled guards against a zombie listener if this effect re-runs
    // before authStateReady() resolves (e.g. rapid pathname changes).
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    auth.authStateReady().then(() => {
      if (cancelled) return;
      unsubscribe = onAuthStateChanged(auth, (user) => {
        // auth.currentUser is a synchronous fallback — onAuthStateChanged can
        // briefly report null right after a popup sign-in before the state
        // has propagated, so we double-check before redirecting.
        if (user || auth.currentUser) {
          setReady(true);
        } else {
          router.push("/auth/login");
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router, isPublic]);

  if (!ready && !isPublic) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink">
        <div className="w-8 h-8 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
