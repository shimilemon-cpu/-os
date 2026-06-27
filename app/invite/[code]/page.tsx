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
    <div className="min-h-screen flex flex-col items-center justify-center px-8 space-y-6">
      {status === "joining" ? (
        <>
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          <p className="text-[var(--muted)] text-sm">ルームに参加中...</p>
        </>
      ) : (
        <div className="text-center space-y-4">
          <p className="text-[var(--danger)] text-sm">{error}</p>
          <button
            onClick={() => router.push("/rooms")}
            className="text-[var(--accent)] text-sm underline"
          >
            ルーム一覧に戻る
          </button>
        </div>
      )}
    </div>
  );
}
