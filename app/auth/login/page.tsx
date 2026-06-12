"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithRedirect, getRedirectResult, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ログイン成功後：初回ならFirestoreにユーザー作成して遷移
  const handleUser = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        nickname: user.displayName ?? "ゲスト",
        birthYear: null,
        gender: null,
        createdAt: new Date(),
      });
      router.push("/onboarding");
    } else {
      router.push("/");
    }
  };

  // リダイレクトから戻ってきた結果を処理
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await handleUser(result.user);
        } else if (auth.currentUser) {
          // すでにログイン済み
          router.push("/");
        } else {
          setProcessing(false);
        }
      })
      .catch((e) => {
        console.error(e);
        setError("ログインに失敗しました。もう一度お試しください。");
        setProcessing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async () => {
    setError(null);
    setProcessing(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (e) {
      console.error(e);
      setError("ログインを開始できませんでした。もう一度お試しください。");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 bg-[#0e0b0e]">
      <div className="w-full max-w-sm space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-[#c48a9f] text-3xl font-bold tracking-[0.3em]">CAPSULE</h1>
          <p className="text-[#7a6475] text-sm tracking-wider">3分半で、あの日に帰ろう。</p>
        </div>

        <div className="text-center space-y-1 py-4 border-y border-[#2d1e30]">
          <p className="text-[#ede0e8] text-sm leading-relaxed">曲を聴く。誰かの記憶を覗く。</p>
          <p className="text-[#ede0e8] text-sm leading-relaxed">自分の記憶も蘇る。</p>
        </div>

        {processing ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 rounded-full border-2 border-[#c48a9f] border-t-transparent animate-spin" />
          </div>
        ) : (
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-[#1a1520] border border-[#2d1e30] rounded-2xl py-4 text-[#ede0e8] text-sm font-medium hover:border-[#c48a9f]/40 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </button>
        )}

        {error && <p className="text-center text-[#c48a9f] text-xs">{error}</p>}

        <p className="text-center text-[#7a6475] text-[10px] leading-relaxed">
          ログインすることで、利用規約とプライバシーポリシーに同意したことになります。
        </p>
      </div>
    </div>
  );
}
