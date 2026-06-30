"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { joinRoomByCode } from "@/lib/ogiri/rooms";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<"joining" | "error">("joining");
  const [error, setError] = useState("");

  useEffect(() => {
    const join = async () => {
      try {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user) {
          router.push(`/auth/login?next=/invite/${code}`);
          return;
        }
        const roomId = await joinRoomByCode(code, user.uid, user.displayName ?? "ゲスト");
        router.replace(`/rooms/${roomId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "参加に失敗しました");
        setStatus("error");
      }
    };
    join();
  }, [code, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 space-y-5 bg-ink">
      {status === "joining" ? (
        <>
          <svg className="w-16 h-[70px] animate-spinslow" style={{ animationDuration: "4s" }}>
            <use href="#c-daruma" width="100%" height="100%"/>
          </svg>
          <div className="text-center space-y-1">
            <p className="font-display font-bold text-text text-lg">寄合所に入室中…</p>
            <p className="text-text-muted text-xs">しばらくお待ちください</p>
          </div>
        </>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-pop-red text-sm font-bold">{error}</p>
          <button
            onClick={() => router.push("/rooms")}
            className="text-pop-green text-sm font-bold underline"
          >
            寄合所に戻る
          </button>
        </div>
      )}
    </div>
  );
}
