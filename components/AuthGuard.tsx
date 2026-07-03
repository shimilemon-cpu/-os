"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const subscribedRef = useRef(false);

  const isPublic = pathname === "/" || pathname.startsWith("/auth");

  useEffect(() => {
    if (isPublic) return;
    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.push("/auth/login");
    });

    return () => {
      subscribedRef.current = false;
      unsubscribe();
    };
  }, [router, isPublic]);

  return <>{children}</>;
}
