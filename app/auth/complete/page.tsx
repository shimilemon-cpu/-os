"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

function CompleteInner() {
  const router = useRouter();
  const params = useSearchParams();
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const rawNext = params.get("next") ?? "/rooms";
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/rooms";
    const name = params.get("name");
    const picture = params.get("picture");

    fetch("/api/auth/token")
      .then((r) => r.json() as Promise<{ token: string | null }>)
      .then(async ({ token }) => {
        if (!token) {
          router.replace("/auth/login");
          return;
        }
        const cred = await signInWithCustomToken(auth, token);
        if (name) {
          localStorage.setItem("ogiri_nickname", name);
          await updateProfile(cred.user, {
            displayName: name,
            photoURL: picture ?? undefined,
          }).catch(console.error);
        }
        router.replace(next);
      })
      .catch((e) => {
        console.error("Custom token sign-in failed:", e);
        router.replace("/auth/login?error=signin_failed");
      });
  }, [params, router]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-paper gap-3">
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "#2BA35F", borderTopColor: "transparent" }}
      />
      <p className="font-gothic text-sub" style={{ fontSize: 13 }}>
        ログイン中...
      </p>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-paper">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#2BA35F", borderTopColor: "transparent" }} />
        </div>
      }
    >
      <CompleteInner />
    </Suspense>
  );
}
