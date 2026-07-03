"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { joinRoomByCode } from "@/lib/ogiri/rooms";
import { getDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import Engimono from "@/components/Engimono";
import Noren from "@/components/Noren";

export default function JoinRoomPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    const trimmed = code.trim();
    if (trimmed.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("未ログイン");
      const roomId = await joinRoomByCode(trimmed, user.uid, user.displayName ?? "ゲスト");
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          nickname: user.displayName ?? "ゲスト",
          avatarUrl: user.photoURL ?? null,
          createdAt: Timestamp.now(),
        });
      }
      router.push(`/rooms/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "参加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper bg-asanoha relative overflow-hidden">
      {/* 暖簾 */}
      <div className="pt-3 px-6">
        <Noren text="入室" />
      </div>

      {/* 縁起物 */}
      <Engimono name="cat" width={68} height={73} style={{ position: "absolute", top: 90, right: -8, opacity: 0.85, transform: "rotate(8deg)" }} />
      <Engimono name="koban" width={29} height={44} style={{ position: "absolute", top: 140, left: 12, opacity: 0.55, transform: "rotate(-12deg)" }} />

      {/* メイン */}
      <div className="relative flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="w-full max-w-sm mx-auto flex flex-col animate-pop-in">
          {/* タイトル */}
          <div className="text-center mb-6">
            <h1
              className="font-mincho font-extrabold text-[#1A1714]"
              style={{ fontSize: 28, lineHeight: 1.2 }}
            >
              あいことばで入室
            </h1>
            <div className="flex items-center justify-center gap-[8px] mt-3">
              <span style={{ height: 1, width: 32, background: "rgba(0,0,0,.2)" }} />
              <p className="font-gothic text-sub" style={{ fontSize: 11 }}>
                友達から教えてもらった合言葉を入力
              </p>
              <span style={{ height: 1, width: 32, background: "rgba(0,0,0,.2)" }} />
            </div>
          </div>

          {/* 入力カード */}
          <div
            className="relative bg-white mb-4"
            style={{
              borderRadius: 20, padding: "18px 18px 16px",
              border: "1px solid rgba(0,0,0,.07)",
              boxShadow: "0 10px 30px -18px rgba(40,30,10,.35)",
            }}
          >
            <div className="absolute" style={{ top: -8, left: 16, width: 54, height: 16, background: "#E0A93B", borderRadius: 4, transform: "rotate(-2deg)" }}>
              <p className="font-mincho font-extrabold text-paper text-center" style={{ fontSize: 10, lineHeight: "16px", letterSpacing: "0.08em" }}>合言葉</p>
            </div>

            <label className="font-gothic font-extrabold text-sub mb-2 block" style={{ fontSize: 11, letterSpacing: "0.12em" }}>
              ＼ あいことばを入力 ／
            </label>
            <input
              className="w-full bg-[#FBF7EC] font-mincho font-extrabold text-[#1A1714] outline-none text-center"
              style={{
                fontSize: 28, padding: "14px", borderRadius: 12,
                border: "1.5px solid #E0A93B", letterSpacing: "0.3em",
              }}
              placeholder="ひらがな"
              maxLength={8}
              value={code}
              autoFocus
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && join()}
            />
            <p className="font-gothic text-sub text-center mt-2" style={{ fontSize: 10 }}>
              ひらがな・カタカナ・英数字に対応
            </p>

            {error && (
              <p className="font-gothic text-center mt-2" style={{ fontSize: 12, color: "#E5402F" }}>{error}</p>
            )}
          </div>

          {/* 入室ボタン */}
          <button
            onClick={join}
            disabled={code.trim().length < 2 || loading}
            className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-transform"
            style={{
              fontSize: 19, padding: "16px 0", borderRadius: 18,
              background: "linear-gradient(180deg,#EE4F3A,#E5402F)",
              boxShadow: "0 14px 26px -10px rgba(229,64,47,0.6)",
            }}
          >
            {loading ? "入室中…" : "入室する →"}
          </button>

          {/* 戻るリンク */}
          <Link
            href="/rooms"
            className="w-full text-center font-gothic text-sub text-sm py-4 active:opacity-70 transition-opacity block mt-2"
          >
            ← 寄合所に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
