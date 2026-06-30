"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { joinRoomByCode } from "@/lib/ogiri/rooms";
import Engimono from "@/components/Engimono";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-5 bg-paper">
      {status === "joining" ? (
        <>
          <Engimono name="daruma" width={64} height={70} style={{ animation: "spinslow 4s linear infinite" }} />
          <div className="text-center">
            <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 20 }}>寄合所に入室中…</p>
            <p className="font-gothic text-sub mt-1" style={{ fontSize: 12 }}>しばらくお待ちください</p>
          </div>
        </>
      ) : (
        <div className="text-center flex flex-col gap-4">
          <Engimono name="daruma" width={56} height={62} style={{ opacity: 0.4, margin: "0 auto" }} />
          <p className="font-gothic font-bold" style={{ fontSize: 14, color: "#E5402F" }}>{error}</p>
          <button
            onClick={() => router.push("/rooms")}
            className="font-gothic font-bold text-sub underline"
            style={{ fontSize: 14 }}
          >
            寄合所に戻る
          </button>
        </div>
      )}
    </div>
  );
}
