"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithRedirect, signInWithPopup, getRedirectResult, type User } from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase/client";
import Engimono from "@/components/Engimono";

const REDIRECT_FLAG = "capsule_login_redirect_ts";

function isIOS() {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleUser = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        nickname: user.displayName ?? "ゲスト",
        avatarUrl: user.photoURL ?? null,
        createdAt: Timestamp.now(),
      });
    }
    router.push("/rooms");
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          localStorage.removeItem(REDIRECT_FLAG);
          await handleUser(result.user);
        } else if (auth.currentUser) {
          router.push("/rooms");
        } else {
          const ts = localStorage.getItem(REDIRECT_FLAG);
          if (ts && Date.now() - Number(ts) < 5 * 60 * 1000) {
            localStorage.removeItem(REDIRECT_FLAG);
            setError(
              "ログインできませんでした。\niOS Safariの場合は「設定」→「Safari」→「クロスサイトトラッキングを防ぐ」をオフにするか、Chromeをお試しください。"
            );
          }
          setProcessing(false);
        }
      })
      .catch((e) => {
        console.error("[auth] getRedirectResult error:", e);
        localStorage.removeItem(REDIRECT_FLAG);
        setError("ログインに失敗しました。もう一度お試しください。");
        setProcessing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doRedirect = async () => {
    localStorage.setItem(REDIRECT_FLAG, Date.now().toString());
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch {
      localStorage.removeItem(REDIRECT_FLAG);
      setError("ログインを開始できませんでした。もう一度お試しください。");
      setProcessing(false);
    }
  };

  const signIn = async () => {
    setError(null);
    setProcessing(true);

    if (isIOS()) {
      await doRedirect();
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleUser(result.user);
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? "";
      console.error("[auth] signInWithPopup failed:", code, e);

      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        if (auth.currentUser) {
          try { await handleUser(auth.currentUser); } catch { setProcessing(false); }
        } else {
          setProcessing(false);
        }
        return;
      }

      if (code === "auth/unauthorized-domain") {
        setError("このドメインはFirebaseに未登録です。Firebase Console → Authentication → 承認済みドメインにVercelのURLを追加してください。");
        setProcessing(false);
        return;
      }

      await doRedirect();
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

      <div className="relative w-full max-w-sm flex flex-col items-center gap-[32px] animate-pop-in">
        {/* ロゴ */}
        <div className="text-center">
          <Engimono name="daruma" width={90} height={100} style={{ margin: "0 auto 12px" }} />
          <h1 className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 34, lineHeight: 1.2 }}>
            大喜利<span style={{ color: "#E5402F" }}>Pocket</span>
          </h1>
          <p className="font-gothic text-sub mt-2" style={{ fontSize: 13 }}>みんなで、ひと笑い。</p>
        </div>

        {/* フィーチャーピル */}
        <div className="flex flex-wrap justify-center gap-2 animate-rise">
          {["🎤 みんなで大喜利", "🤖 AIが採点", "🎭 笑いが深まる"].map((t) => (
            <span
              key={t}
              className="font-gothic font-bold"
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, background: "#EBE2CF", color: "#52493A" }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* ログインボタン */}
        {processing ? (
          <div className="py-4">
            <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={signIn}
              className="w-full flex items-center justify-center gap-3 font-gothic font-extrabold text-paper active:scale-95 transition-transform"
              style={{ fontSize: 15, padding: "16px 0", borderRadius: 18, background: "#1A1714", boxShadow: "0 14px 26px -10px rgba(0,0,0,.35)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleでログイン
            </button>
            <p className="text-center font-gothic text-sub" style={{ fontSize: 10, lineHeight: 1.6 }}>
              ログインすることで、利用規約とプライバシーポリシーに同意したことになります。
            </p>
          </div>
        )}

        {error && (
          <p className="text-center font-gothic whitespace-pre-line" style={{ fontSize: 12, color: "#E5402F" }}>{error}</p>
        )}
      </div>
    </div>
  );
}
