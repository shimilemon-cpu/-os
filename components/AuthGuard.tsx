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

    let unsubscribe: (() => void) | null = null;

    // Wait for Firebase to finish loading auth state from IndexedDB before
    // deciding to redirect. Without this, onAuthStateChanged may fire null
    // during initialization and cause a redirect loop.
    auth.authStateReady().then(() => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (!user) {
          router.push("/auth/login");
        } else {
          setReady(true);
        }
      });
    });

    return () => { unsubscribe?.(); };
  }, [router, isPublic]);

  if (!ready && !isPublic) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-[#c48a9f] border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
