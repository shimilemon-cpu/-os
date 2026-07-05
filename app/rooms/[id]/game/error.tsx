"use client";

export default function GameError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper px-6">
      <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 20 }}>
        読み込みエラー
      </p>
      <p className="font-gothic text-sub text-center" style={{ fontSize: 13, lineHeight: 1.6 }}>
        ページの読み込みに失敗しました。
        <br />
        通信状況を確認して再試行してください。
      </p>
      <button
        onClick={reset}
        className="font-gothic font-bold text-paper active:scale-[0.98] transition-all"
        style={{ fontSize: 15, padding: "12px 32px", borderRadius: 14, background: "#E5402F" }}
      >
        再試行
      </button>
    </div>
  );
}
