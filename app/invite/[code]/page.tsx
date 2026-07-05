"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { getInviteInfo, joinRoomByCode } from "@/lib/ogiri/rooms";
import type { InviteCodeDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [invite, setInvite] = useState<InviteCodeDoc | null>(null);
  const [status, setStatus] = useState<"loading" | "card" | "joining" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    getInviteInfo(code).then((info) => {
      if (!info) {
        setError("この招待リンクは無効です");
        setStatus("error");
      } else {
        setInvite(info);
        setStatus("card");
      }
    });
  }, [code]);

  const handleJoin = async () => {
    setStatus("joining");
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) {
        router.push(`/auth/login?next=/invite/${code}`);
        return;
      }
      const savedNickname = localStorage.getItem("ogiri_nickname");
      const nickname = savedNickname || user.displayName || "ゲスト";
      const roomId = await joinRoomByCode(code.toUpperCase(), user.uid, nickname);
      router.replace(`/rooms/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "参加に失敗しました");
      setStatus("error");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E0A93B", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 gap-5 bg-paper">
        <Engimono name="daruma" width={56} height={62} style={{ opacity: 0.4 }} />
        <p className="font-gothic font-bold" style={{ fontSize: 14, color: "#E5402F" }}>{error}</p>
        <button
          onClick={() => router.push("/rooms")}
          className="font-gothic font-bold text-sub underline"
          style={{ fontSize: 14 }}
        >
          寄合所に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper bg-asanoha relative overflow-hidden">
      <Engimono name="cat" width={68} height={73} style={{ position: "absolute", top: 40, right: -8, opacity: 0.7, transform: "rotate(8deg)" }} />
      <Engimono name="koban" width={44} height={29} style={{ position: "absolute", top: 100, left: 12, opacity: 0.45, transform: "rotate(-12deg)" }} />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center animate-pop-in">
          <Engimono name="mallet" width={56} height={56} style={{ marginBottom: 16 }} />

          <p className="font-mincho font-extrabold text-[#1A1714] mb-1" style={{ fontSize: 13, letterSpacing: "0.14em" }}>
            大喜利Pocketへの招待
          </p>

          {/* 招待カード */}
          <div
            className="w-full bg-white relative mt-3"
            style={{
              borderRadius: 22,
              padding: "24px 22px 20px",
              border: "1.5px dashed #E0A93B",
              boxShadow: "0 12px 32px -14px rgba(40,30,10,.25)",
            }}
          >
            <div className="absolute" style={{ top: -10, left: 18, width: 44, height: 18, background: "#E5402F", borderRadius: 4, transform: "rotate(-2deg)" }}>
              <p className="font-mincho font-extrabold text-paper text-center" style={{ fontSize: 10, lineHeight: "18px", letterSpacing: "0.08em" }}>招 待</p>
            </div>

            {invite?.roomName && (
              <div className="text-center mb-3">
                <p className="font-gothic font-extrabold text-sub" style={{ fontSize: 10, letterSpacing: "0.1em", marginBottom: 4 }}>部屋名</p>
                <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 22, lineHeight: 1.2 }}>
                  {invite.roomName}
                </p>
              </div>
            )}

            {invite?.hostNickname && (
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="grid place-items-center" style={{ width: 28, height: 28, background: "#F0EBE0", borderRadius: "50%" }}>
                  <Engimono name="fuku" width={16} height={17} />
                </div>
                <p className="font-gothic font-bold text-sub" style={{ fontSize: 13 }}>
                  {invite.hostNickname} が招待しています
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mt-2">
              <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.08)" }} />
              <p className="font-mincho font-extrabold tracking-[0.3em]" style={{ fontSize: 24, color: "#E0A93B" }}>
                {code.toUpperCase()}
              </p>
              <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.08)" }} />
            </div>
          </div>

          {/* 参加ボタン */}
          <button
            onClick={handleJoin}
            disabled={status === "joining"}
            className="w-full font-mincho font-extrabold text-paper active:scale-[0.98] transition-transform mt-5 disabled:opacity-60"
            style={{
              fontSize: 18, padding: "16px 0", borderRadius: 18,
              background: "#2BA35F",
              boxShadow: "0 14px 26px -10px rgba(43,163,95,.5)",
            }}
          >
            {status === "joining" ? "入室中…" : "参加する →"}
          </button>

          <button
            onClick={() => router.push("/rooms")}
            className="font-gothic text-sub mt-4 active:opacity-70 transition-opacity"
            style={{ fontSize: 12 }}
          >
            寄合所に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
