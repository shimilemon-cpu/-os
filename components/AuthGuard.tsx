"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

let globalAuthResolved = false;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(globalAuthResolved && !!auth.currentUser);
  const subscribedRef = useRef(false);

  const isPublic = pathname === "/" || pathname.startsWith("/auth");

  useEffect(() => {
    if (isPublic) {
      setReady(true);
      return;
    }

    if (globalAuthResolved && auth.currentUser) {
      setReady(true);
      return;
    }

    if (subscribedRef.current) return;
    subscribedRef.current = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      globalAuthResolved = true;
      if (user) {
        setReady(true);
      } else {
        router.push("/auth/login");
      }
    });

    return () => {
      subscribedRef.current = false;
      unsubscribe();
    };
  }, [router, isPublic]);

  if (!ready && !isPublic) {
    return (
      <div className="flex items-center justify-center h-screen bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
