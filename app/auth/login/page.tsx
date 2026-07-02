"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import Engimono from "@/components/Engimono";

const NICKNAME_KEY = "ogiri_nickname";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/rooms";

  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(NICKNAME_KEY) : null;
    if (saved) setNickname(saved);
    // 既にログイン済みならスキップ
    auth.authStateReady().then(() => {
      if (auth.currentUser) router.replace(next);
    });
  }, [router, next]);

  const start = async () => {
    const name = nickname.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // 既存のUIDを引き継ぐ（サインアウトしていない限り）
      const cred = auth.currentUser ? { user: auth.currentUser } : await signInAnonymously(auth);
      const user = cred.user;
      await updateProfile(user, { displayName: name });
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { nickname: name, avatarUrl: null, createdAt: Timestamp.now() });
      } else {
        await setDoc(userRef, { nickname: name }, { merge: true });
      }
      localStorage.setItem(NICKNAME_KEY, name);
      router.replace(next);
    } catch (e) {
      console.error("[auth] anonymous sign-in failed:", e);
      setError("入室に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-paper">
      {/* 縁起物 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Engimono name="cat" width={80} height={87} style={{ position: "absolute", top: "6%", right: "8%", opacity: 0.7, transform: "rotate(8deg)" }} />
        <Engimono name="daruma" width={56} height={62} style={{ position: "absolute", top: "22%", left: "4%", opacity: 0.55, transform: "rotate(-10deg)" }} />
        <Engimono name="fuku" width={64} height={74} style={{ position: "absolute", bottom: "18%", right: "6%", opacity: 0.6, transform: "rotate(6deg)" }} />
        <Engimono name="mask" width={48} height={50} style={{ position: "absolute", bottom: "28%", left: "10%", opacity: 0.5, transform: "rotate(-14deg)" }} />
        <Engimono name="koban" width={40} height={26} style={{ position: "absolute", top: "46%", right: "14%", opacity: 0.45 }} />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center gap-[28px] animate-pop-in">
        {/* ロゴ */}
        <div className="text-center">
          <Engimono name="daruma" width={90} height={100} style={{ margin: "0 auto 12px" }} />
          <h1 className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 34, lineHeight: 1.2 }}>
            大喜利<span style={{ color: "#E5402F" }}>Pocket</span>
          </h1>
          <p className="font-gothic text-sub mt-2" style={{ fontSize: 13 }}>みんなで、ひと笑い。</p>
        </div>

        {/* ニックネーム入力 */}
        <div className="w-full flex flex-col gap-3">
          <label className="font-gothic font-extrabold text-sub" style={{ fontSize: 12 }}>
            あなたの名前
          </label>
          <input
            className="w-full bg-white font-gothic font-semibold text-[#1A1714] outline-none"
            style={{
              fontSize: 17, padding: "14px 16px", borderRadius: 16,
              border: "1.5px solid #E0A93B",
            }}
            placeholder="例）タロウ"
            maxLength={12}
            value={nickname}
            autoFocus
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
          />
          <div className="flex justify-end font-gothic text-sub" style={{ fontSize: 11 }}>
            {nickname.length} / 12
          </div>

          <button
            onClick={start}
            disabled={!nickname.trim() || submitting}
            className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-95 transition-transform"
            style={{ fontSize: 17, padding: "16px 0", borderRadius: 18, background: "#E5402F", boxShadow: "0 14px 26px -10px rgba(229,64,47,0.6)" }}
          >
            {submitting ? "入室中…" : "はじめる"}
          </button>

          <p className="text-center font-gothic text-sub" style={{ fontSize: 10, lineHeight: 1.6 }}>
            登録不要・名前だけで遊べます。名前はいつでも変更できます。
          </p>
        </div>

        {error && (
          <p className="text-center font-gothic" style={{ fontSize: 12, color: "#E5402F" }}>{error}</p>
        )}
      </div>
    </div>
  );
}
