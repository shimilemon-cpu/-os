"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

const PUBLIC_PREFIXES = ["/auth", "/invite", "/engawa"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const unsubRef = useRef<(() => void) | null>(null);

  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isPublic) {
      unsubRef.current?.();
      unsubRef.current = null;
      return;
    }
    if (unsubRef.current) return;

    let cancelled = false;
    auth.authStateReady().then(() => {
      if (cancelled) return;
      unsubRef.current = onAuthStateChanged(auth, (user) => {
        if (!user) router.replace("/auth/login");
      });
    });

    return () => {
      cancelled = true;
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [router, isPublic, pathname]);

  return <>{children}</>;
}
