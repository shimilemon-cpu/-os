"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAnonymously, updateProfile } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import Engimono from "@/components/Engimono";
import Noren from "@/components/Noren";

const NICKNAME_KEY = "ogiri_nickname";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    }>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? "/rooms";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/rooms";
  const errorParam = searchParams.get("error");

  const [showGuest, setShowGuest] = useState(false);
  const [nickname, setNickname] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ERROR_MESSAGES: Record<string, string> = {
    line_denied: "LINEログインがキャンセルされました",
    no_state: "セッションが切れました（Cookieなし）。もう一度お試しください",
    invalid_state: "セッションが無効です（state不一致）。もう一度お試しください",
    token_failed: "LINEトークン取得に失敗しました。コールバックURLを確認してください",
    profile_failed: "LINEプロフィール取得に失敗しました",
    auth_failed: "Firebase認証に失敗しました（サーバー設定を確認）",
    signin_failed: "クライアント側のログインに失敗しました",
  };
  const [error, setError] = useState<string | null>(
    errorParam ? (ERROR_MESSAGES[errorParam] ?? `エラー: ${errorParam}`) : null,
  );
  const didAutoStart = useRef(false);

  useEffect(() => {
    if (didAutoStart.current) return;
    didAutoStart.current = true;
    router.prefetch(next);
    auth.authStateReady().then(async () => {
      if (auth.currentUser) {
        router.replace(next);
        return;
      }
      const saved = localStorage.getItem(NICKNAME_KEY);
      if (saved) {
        try {
          setSubmitting(true);
          const cred = await signInAnonymously(auth);
          await updateProfile(cred.user, { displayName: saved });
          setDoc(
            doc(db, "users", cred.user.uid),
            { nickname: saved, avatarUrl: null, avatarIcon: null, createdAt: Timestamp.now() },
            { merge: true },
          ).catch((e) => console.error("[auth] Firestore write failed:", e));
          router.replace(next);
        } catch {
          setSubmitting(false);
        }
      }
    });
  }, [next, router]);

  const loginWithLine = () => {
    window.location.href = `/api/auth/line?next=${encodeURIComponent(next)}`;
  };

  const guestStart = async () => {
    const name = nickname.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const cred = auth.currentUser
        ? { user: auth.currentUser }
        : await signInAnonymously(auth);
      const user = cred.user;
      localStorage.setItem(NICKNAME_KEY, name);
      await updateProfile(user, { displayName: name });
      setDoc(
        doc(db, "users", user.uid),
        { nickname: name, avatarUrl: null, avatarIcon: null, createdAt: Timestamp.now() },
        { merge: true },
      ).catch((e) => console.error("[auth] Firestore write failed:", e));
      router.replace(next);
    } catch (e) {
      console.error("[auth] sign-in failed:", e);
      setError("入室に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  };

  if (submitting && !showGuest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-paper gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#2BA35F", borderTopColor: "transparent" }}
        />
        <p className="font-gothic text-sub" style={{ fontSize: 13 }}>ログイン中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper bg-asanoha relative overflow-hidden">
      {/* 暖簾 */}
      <div className="pt-3 px-6">
        <Noren text="大喜利" />
      </div>

      {/* 縁起物 */}
      <Engimono name="cat" width={68} height={73} style={{ position: "absolute", top: 90, right: -8, opacity: 0.85, transform: "rotate(8deg)" }} />
      <Engimono name="koban" width={44} height={29} style={{ position: "absolute", top: 130, left: 12, opacity: 0.55, transform: "rotate(-12deg)" }} />
      <Engimono name="fuku" width={58} height={67} style={{ position: "absolute", bottom: 20, right: 14, opacity: 0.6, transform: "rotate(6deg)" }} />
      <Engimono name="mask" width={42} height={44} style={{ position: "absolute", bottom: 60, left: -6, opacity: 0.4, transform: "rotate(-14deg)" }} />

      {/* メイン */}
      <div className="relative flex-1 flex flex-col justify-center px-6 pb-[100px]">
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

          {/* LINE ログインボタン */}
          <button
            onClick={loginWithLine}
            className="w-full flex items-center justify-center gap-3 font-gothic font-extrabold text-white active:scale-[0.98] transition-transform mb-3"
            style={{
              fontSize: 17, padding: "16px 0", borderRadius: 18,
              background: "#06C755",
              boxShadow: "0 14px 26px -10px rgba(6,199,85,0.5)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 5.82 2 10.5c0 2.83 1.68 5.33 4.2 6.95-.1.82-.53 3.07-.61 3.55-.1.62.23.61.48.44.2-.13 2.82-1.92 3.97-2.7.63.09 1.28.14 1.96.14 5.52 0 10-3.82 10-8.5S17.52 2 12 2zm-3.17 11.13H6.85a.57.57 0 01-.57-.57V7.94a.57.57 0 011.14 0v4.05h1.41a.57.57 0 010 1.14zm1.68-.57a.57.57 0 01-1.14 0V7.94a.57.57 0 011.14 0v4.62zm4.2 0a.57.57 0 01-.44.56.56.56 0 01-.58-.2L11.8 9.96v2.6a.57.57 0 01-1.14 0V7.94a.57.57 0 01.44-.56.56.56 0 01.58.2l1.89 2.96V7.94a.57.57 0 011.14 0v4.62zm3.3-3.48a.57.57 0 010 1.14h-1.42v.91h1.42a.57.57 0 010 1.14h-1.99a.57.57 0 01-.57-.57V7.94a.57.57 0 01.57-.57h1.99a.57.57 0 010 1.14h-1.42v.91h1.42z"/>
            </svg>
            LINEでログイン
          </button>

          {/* フィーチャーピル */}
          <div className="flex justify-center gap-[6px] mt-1 mb-4">
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

          {/* ゲスト入室（折りたたみ） */}
          {!showGuest ? (
            <button
              onClick={() => setShowGuest(true)}
              className="w-full text-center font-gothic text-sub active:opacity-70 transition-opacity"
              style={{ fontSize: 12, padding: "10px 0" }}
            >
              LINEなしで遊ぶ →
            </button>
          ) : (
            <div className="animate-pop-in">
              <div
                className="relative bg-white mb-3"
                style={{
                  borderRadius: 20, padding: "18px 18px 16px",
                  border: "1px solid rgba(0,0,0,.07)",
                  boxShadow: "0 10px 30px -18px rgba(40,30,10,.35)",
                }}
              >
                <div className="absolute" style={{ top: -8, left: 16, width: 40, height: 16, background: "#E5402F", borderRadius: 4, transform: "rotate(-2deg)" }}>
                  <p className="font-mincho font-extrabold text-paper text-center" style={{ fontSize: 10, lineHeight: "16px", letterSpacing: "0.08em" }}>入 場</p>
                </div>
                <label className="font-gothic font-extrabold text-sub mb-2 block" style={{ fontSize: 11, letterSpacing: "0.12em" }}>
                  ＼ お名前を入力 ／
                </label>
                <input
                  className="w-full bg-[#FBF7EC] font-gothic font-bold text-[#1A1714] outline-none"
                  style={{ fontSize: 18, padding: "12px 14px", borderRadius: 12, border: "1.5px solid #E0A93B" }}
                  placeholder="例）タロウ"
                  maxLength={12}
                  autoComplete="off"
                  value={nickname}
                  autoFocus
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && guestStart()}
                />
                <p className="font-gothic text-sub text-right mt-1" style={{ fontSize: 10 }}>{nickname.length}/12</p>
              </div>
              <button
                onClick={guestStart}
                disabled={!nickname.trim() || submitting}
                className="w-full font-gothic font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-transform"
                style={{
                  fontSize: 15, padding: "14px 0", borderRadius: 18,
                  background: "#1A1714",
                }}
              >
                {submitting ? "入室中…" : "ゲストで入室 →"}
              </button>
            </div>
          )}

          <p className="text-center font-gothic text-sub mt-3" style={{ fontSize: 10, lineHeight: 1.6 }}>
            LINEでログインすると、どの端末でも同じアカウントで遊べます
          </p>

          {error && (
            <p className="text-center font-gothic mt-2" style={{ fontSize: 12, color: "#E5402F" }}>{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
