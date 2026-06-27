"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { createRoom } from "@/lib/ogiri/rooms";
import { ArrowLeft } from "lucide-react";

export default function NewRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"realtime" | "async">("realtime");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("未ログイン");
      const roomId = await createRoom(user.uid, user.displayName ?? "ゲスト", name.trim(), mode);
      router.push(`/rooms/${roomId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 pt-12 pb-24">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-[var(--muted)] text-sm mb-8"
      >
        <ArrowLeft size={16} /> 戻る
      </button>

      <h1 className="serif text-[var(--accent)] text-2xl font-bold mb-8">ルームを作る</h1>

      <div className="space-y-6">
        {/* ルーム名 */}
        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)] tracking-wide">ルーム名</label>
          <input
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-base placeholder:text-[var(--placeholder)] outline-none focus:border-[var(--accent)]/60 transition-colors"
            placeholder="例：金曜の夜"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* モード選択 */}
        <div className="space-y-2">
          <label className="text-xs text-[var(--muted)] tracking-wide">モード</label>
          <div className="grid grid-cols-2 gap-3">
            {(["realtime", "async"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  mode === m
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <p className={`text-sm font-bold ${mode === m ? "text-[var(--accent)]" : "text-[var(--text)]"}`}>
                  {m === "realtime" ? "⚡ リアルタイム" : "⏰ 非同期"}
                </p>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  {m === "realtime"
                    ? "全員同時参加。飲み会・通話向け"
                    : "好きな時間に回答。忙しい人向け"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button
          onClick={create}
          disabled={!name.trim() || loading}
          className="w-full bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-2xl text-base disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {loading ? "作成中..." : "ルームを作成"}
        </button>
      </div>
    </div>
  );
}
