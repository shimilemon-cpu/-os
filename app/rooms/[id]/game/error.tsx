"use client";

import { useEffect } from "react";

export default function GameError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("GameError caught:", error);
  }, [error]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-paper px-6">
      <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 20 }}>
        読み込みエラー
      </p>
      <p className="font-gothic text-sub text-center" style={{ fontSize: 13, lineHeight: 1.6 }}>
        ページの読み込みに失敗しました。
        <br />
        通信状況を確認して再試行してください。
      </p>
      <div className="bg-white w-full max-w-sm overflow-x-auto" style={{ borderRadius: 12, padding: 12, border: "1px solid rgba(0,0,0,.07)" }}>
        <p className="font-gothic text-sub" style={{ fontSize: 10, wordBreak: "break-all" }}>
          {error.message || "Unknown error"}
          {error.digest && ` (digest: ${error.digest})`}
        </p>
        {error.stack && (
          <details className="mt-2">
            <summary className="font-gothic text-sub cursor-pointer" style={{ fontSize: 10 }}>スタックトレース</summary>
            <pre className="font-gothic text-sub mt-1 whitespace-pre-wrap" style={{ fontSize: 9 }}>
              {error.stack}
            </pre>
          </details>
        )}
      </div>
      <button
        onClick={unstable_retry}
        className="font-gothic font-bold text-paper active:scale-[0.98] transition-all"
        style={{ fontSize: 15, padding: "12px 32px", borderRadius: 14, background: "#E5402F" }}
      >
        再試行
      </button>
    </div>
  );
}
