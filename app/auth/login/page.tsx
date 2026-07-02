"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import Engimono from "@/components/Engimono";
import Noren from "@/components/Noren";

const NICKNAME_KEY = "ogiri_nickname";
const NAME_SUGGESTIONS = ["タロウ", "サクラ", "ゲンキ", "ヒカル", "モモ", "ケンタ"];

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

  const pickSuggestion = (name: string) => {
    setNickname(name);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper bg-asanoha relative overflow-hidden">
      {/* 暖簾 */}
      <div className="pt-3 px-6">
        <Noren text="大喜利" />
      </div>

      {/* 縁起物（散らし） */}
      <Engimono name="cat" width={68} height={73} style={{ position: "absolute", top: 90, right: -8, opacity: 0.85, transform: "rotate(8deg)" }} />
      <Engimono name="koban" width={44} height={29} style={{ position: "absolute", top: 130, left: 12, opacity: 0.55, transform: "rotate(-12deg)" }} />
      <Engimono name="fuku" width={58} height={67} style={{ position: "absolute", bottom: 20, right: 14, opacity: 0.6, transform: "rotate(6deg)" }} />
      <Engimono name="mask" width={42} height={44} style={{ position: "absolute", bottom: 60, left: -6, opacity: 0.4, transform: "rotate(-14deg)" }} />

      {/* メイン */}
      <div className="relative flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="w-full max-w-sm mx-auto flex flex-col animate-pop-in">
          {/* ロゴ */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center gap-[8px] mb-3">
              <span
                className="font-mincho font-extrabold"
                style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "#1A1714", color: "#F4C422", letterSpacing: "0.16em" }}
              >
                本 日 開 演
              </span>
            </div>
            <h1
              className="font-mincho font-extrabold text-[#1A1714]"
              style={{ fontSize: 42, lineHeight: 1.05, letterSpacing: "-0.01em" }}
            >
              大喜利<span style={{ color: "#E5402F" }}>Pocket</span>
            </h1>
            <div className="flex items-center justify-center gap-[8px] mt-3">
              <span style={{ height: 1, width: 32, background: "rgba(0,0,0,.2)" }} />
              <p className="font-mincho text-sub" style={{ fontSize: 12, letterSpacing: "0.2em" }}>
                み ん な で 、 ひ と 笑 い
              </p>
              <span style={{ height: 1, width: 32, background: "rgba(0,0,0,.2)" }} />
            </div>
          </div>

          {/* 木札風の名前入力カード */}
          <div
            className="relative bg-white mb-4"
            style={{
              borderRadius: 20, padding: "18px 18px 16px",
              border: "1px solid rgba(0,0,0,.07)",
              boxShadow: "0 10px 30px -18px rgba(40,30,10,.35)",
            }}
          >
            {/* コーナー装飾 */}
            <div className="absolute" style={{ top: -8, left: 16, width: 40, height: 16, background: "#E5402F", borderRadius: 4, transform: "rotate(-2deg)" }}>
              <p className="font-mincho font-extrabold text-paper text-center" style={{ fontSize: 10, lineHeight: "16px", letterSpacing: "0.08em" }}>入 場</p>
            </div>

            <label className="font-gothic font-extrabold text-sub mb-2 block" style={{ fontSize: 11, letterSpacing: "0.12em" }}>
              ＼ お名前を入力 ／
            </label>
            <input
              className="w-full bg-[#FBF7EC] font-gothic font-bold text-[#1A1714] outline-none"
              style={{
                fontSize: 18, padding: "12px 14px", borderRadius: 12,
                border: "1.5px solid #E0A93B",
              }}
              placeholder="例）タロウ"
              maxLength={12}
              value={nickname}
              autoFocus
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && start()}
            />
            <div className="flex justify-between items-center mt-1.5 font-gothic text-sub" style={{ fontSize: 10 }}>
              <span>ひらがな・カタカナ・漢字OK</span>
              <span>{nickname.length}/12</span>
            </div>

            {/* サジェスト */}
            <div className="mt-3 pt-3" style={{ borderTop: "1px dashed rgba(0,0,0,.1)" }}>
              <p className="font-gothic text-sub mb-1.5" style={{ fontSize: 10 }}>思いつかない？</p>
              <div className="flex flex-wrap gap-[6px]">
                {NAME_SUGGESTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => pickSuggestion(n)}
                    className="font-gothic font-bold active:scale-95 transition-transform"
                    style={{
                      fontSize: 12, padding: "5px 11px", borderRadius: 999,
                      background: "#EBE2CF", color: "#52493A",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={start}
            disabled={!nickname.trim() || submitting}
            className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-transform relative"
            style={{
              fontSize: 19, padding: "16px 0", borderRadius: 18,
              background: "linear-gradient(180deg,#EE4F3A,#E5402F)",
              boxShadow: "0 14px 26px -10px rgba(229,64,47,0.6)",
            }}
          >
            {submitting ? "入室中…" : "はじめる →"}
          </button>

          {/* フィーチャーピル */}
          <div className="flex justify-center gap-[6px] mt-4">
            {[
              { icon: "🎤", label: "みんなで大喜利" },
              { icon: "🤖", label: "AIが採点" },
              { icon: "🎭", label: "座布団を稼ぐ" },
            ].map((t) => (
              <span
                key={t.label}
                className="font-gothic font-bold flex items-center gap-1"
                style={{ fontSize: 10, padding: "4px 8px", borderRadius: 999, background: "rgba(255,255,255,.7)", border: "1px solid rgba(0,0,0,.06)", color: "#52493A" }}
              >
                <span>{t.icon}</span>{t.label}
              </span>
            ))}
          </div>

          <p className="text-center font-gothic text-sub mt-3" style={{ fontSize: 10, lineHeight: 1.6 }}>
            登録不要・お名前だけで遊べます
          </p>

          {error && (
            <p className="text-center font-gothic mt-2" style={{ fontSize: 12, color: "#E5402F" }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
