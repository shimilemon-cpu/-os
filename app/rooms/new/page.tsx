"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { createRoom } from "@/lib/ogiri/rooms";

type Judge = "王道" | "辛口";
type Mode = "realtime" | "async";

const JUDGE_INFO: Record<Judge, { emoji: string; title: string; desc: string; color: string }> = {
  王道: { emoji: "👑", title: "王道AI", desc: "芸人目線の本格採点", color: "#FFD600" },
  辛口: { emoji: "🔪", title: "辛口AI", desc: "厳しめ・下ネタNG", color: "#FF4D6D" },
};

const MODE_INFO: Record<Mode, { emoji: string; title: string; desc: string }> = {
  realtime: { emoji: "⚡", title: "リアルタイム", desc: "全員同時にプレイ" },
  async:    { emoji: "⏰", title: "非同期",       desc: "自分のペースで回答" },
};

export default function NewRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("realtime");
  const [judge, setJudge] = useState<Judge>("王道");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    // window.open はユーザー操作の同期コンテキストで呼ばないと iOS Safari にブロックされる
    const lineWindow = window.open("", "_blank");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("未ログイン");
      const { roomId, inviteCode } = await createRoom(
        user.uid,
        user.displayName ?? "ゲスト",
        name.trim(),
        mode,
        [judge],
      );
      const inviteLink = `${window.location.origin}/invite/${inviteCode}`;
      const shareText = `大喜利Pocketで遊ぼう！\n招待コード：${inviteCode}\n↓タップして参加\n${inviteLink}`;
      if (lineWindow) {
        lineWindow.location.href = `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;
      }
      router.push(`/rooms/${roomId}/invite?code=${inviteCode}`);
    } catch (e) {
      lineWindow?.close();
      setError(e instanceof Error ? e.message : "作成に失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-zinc-500 text-sm mb-8"
      >
        ← 戻る
      </button>

      <h1 className="font-display text-pop-yellow text-2xl mb-8">ルームを作る</h1>

      <div className="space-y-7">
        {/* ルーム名 */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 tracking-wide">ルーム名</label>
          <input
            className="w-full bg-surface border border-line rounded-xl px-4 py-3 text-white text-base placeholder:text-zinc-600 outline-none focus:border-pop-yellow/60 transition-colors"
            placeholder="例：金曜の夜"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
        </div>

        {/* モード選択 */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 tracking-wide">プレイモード</label>
          <div className="grid grid-cols-2 gap-3">
            {(["realtime", "async"] as Mode[]).map((m) => {
              const info = MODE_INFO[m];
              const selected = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-2xl border p-4 text-left transition-all active:scale-95 ${
                    selected
                      ? "border-2 border-pop-yellow bg-pop-yellow/10"
                      : "border border-line bg-surface opacity-50"
                  }`}
                >
                  <p className="text-xl mb-1">{info.emoji}</p>
                  <p className="text-sm font-bold text-white">{info.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{info.desc}</p>
                  {selected && (
                    <div className="mt-2 text-[10px] font-bold tracking-wide text-pop-yellow">
                      ✓ 選択中
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 審査AI選択（単一選択） */}
        <div className="space-y-2">
          <label className="text-xs text-zinc-500 tracking-wide">審査AI</label>
          <div className="grid grid-cols-2 gap-3">
            {(["王道", "辛口"] as Judge[]).map((j) => {
              const info = JUDGE_INFO[j];
              const selected = judge === j;
              return (
                <button
                  key={j}
                  onClick={() => setJudge(j)}
                  className={`rounded-2xl border p-4 text-left transition-all active:scale-95 ${
                    selected ? "border-2" : "border border-line bg-surface opacity-50"
                  }`}
                  style={selected ? { borderColor: info.color, background: `${info.color}15` } : {}}
                >
                  <p className="text-xl mb-1">{info.emoji}</p>
                  <p className="text-sm font-bold text-white">{info.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{info.desc}</p>
                  {selected && (
                    <div className="mt-2 text-[10px] font-bold tracking-wide" style={{ color: info.color }}>
                      ✓ 選択中
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-zinc-600">
            ＊「あなたの志向AI」はゲーム終了後に全員の回答を分析して自動表示されます
          </p>
        </div>

        {error && <p className="text-sm text-pop-pink">{error}</p>}

        <button
          onClick={create}
          disabled={!name.trim() || loading}
          className="w-full bg-pop-yellow text-ink font-bold py-4 rounded-2xl text-base disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-ink border-t-transparent animate-spin" />
              作成中...
            </span>
          ) : "ルームを作成してロビーへ →"}
        </button>
      </div>
    </div>
  );
}
