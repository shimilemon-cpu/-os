"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithRedirect, signInWithPopup, getRedirectResult, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase/client";

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
        createdAt: new Date(),
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
          router.push("/");
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
        console.error(e);
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
    <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-ink">
      {/* 散らばる縁起物 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute top-[6%] right-[8%] w-20 animate-floaty" style={{ "--r": "8deg" } as React.CSSProperties}>
          <use href="#c-cat" width="100%" height="100%"/>
        </svg>
        <svg className="absolute top-[22%] left-[4%] w-14 animate-floaty" style={{ "--r": "-10deg", animationDelay: "0.8s" } as React.CSSProperties}>
          <use href="#c-daruma" width="100%" height="100%"/>
        </svg>
        <svg className="absolute bottom-[18%] right-[6%] w-16 animate-floaty" style={{ "--r": "6deg", animationDelay: "0.4s" } as React.CSSProperties}>
          <use href="#c-fuku" width="100%" height="100%"/>
        </svg>
        <svg className="absolute bottom-[28%] left-[10%] w-12 animate-floaty" style={{ "--r": "-14deg", animationDelay: "1.2s" } as React.CSSProperties}>
          <use href="#c-mask" width="100%" height="100%"/>
        </svg>
        <svg className="absolute top-[46%] right-[14%] w-10 animate-spinslow" style={{ animationDelay: "0.5s" } as React.CSSProperties}>
          <use href="#c-koban" width="100%" height="100%"/>
        </svg>
      </div>

      <div className="relative w-full max-w-sm space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3 animate-pop-in">
          <svg className="w-28 h-28 mx-auto animate-floaty" style={{ "--r": "-4deg" } as React.CSSProperties}>
            <use href="#c-daruma" width="100%" height="100%"/>
          </svg>
          <h1 className="font-display text-text text-4xl font-bold leading-tight">
            大喜利<span className="text-pop-red">Pocket</span>
          </h1>
          <p className="text-text-muted text-sm">みんなで、ひと笑い。</p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 animate-rise">
          {["🎤 みんなで大喜利", "🤖 AIが採点", "🎭 笑いが深まる"].map((t) => (
            <span key={t} className="bg-surface border border-line text-text-sub text-xs px-3 py-1.5 rounded-full font-medium">
              {t}
            </span>
          ))}
        </div>

        {processing ? (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 rounded-full border-2 border-pop-red border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={signIn}
              className="w-full flex items-center justify-center gap-3 bg-[#1A1714] text-[#FBF7EC] text-sm font-bold rounded-2xl py-4 active:scale-95 transition-transform shadow-lg"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Googleでログイン
            </button>

            <p className="text-center text-text-faint text-[10px] leading-relaxed">
              ログインすることで、利用規約とプライバシーポリシーに同意したことになります。
            </p>
          </div>
        )}

        {error && (
          <p className="text-center text-pop-red text-xs whitespace-pre-line">{error}</p>
        )}
      </div>
    </div>
  );
}
