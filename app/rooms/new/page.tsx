"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { createRoom, generateInviteCode, generateRoomRef } from "@/lib/ogiri/rooms";

type Judge = "王道" | "辛口";
type Mode = "realtime" | "async";

const JUDGE_INFO: Record<Judge, { emoji: string; title: string; desc: string; color: string }> = {
  王道: { emoji: "👑", title: "王道AI", desc: "芸人目線の本格採点", color: "#F4C422" },
  辛口: { emoji: "🔪", title: "辛口AI", desc: "厳しめ・下ネタNG", color: "#E5402F" },
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
  const [error, setError] = useState("");

  const create = () => {
    if (!name.trim()) return;
    const user = auth.currentUser;
    if (!user) { setError("未ログイン"); return; }

    const inviteCode = generateInviteCode();
    const roomRef = generateRoomRef();
    const roomId = roomRef.id;

    router.push(`/rooms/${roomId}/invite?code=${inviteCode}`);

    createRoom(user.uid, user.displayName ?? "ゲスト", name.trim(), mode, [judge], roomRef, inviteCode)
      .catch((e) => console.error("createRoom failed:", e));
  };

  return (
    <div className="min-h-screen px-5 pt-4 pb-24 bg-ink">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-[13px] bg-surface grid place-items-center"
          style={{ border: "1px solid rgba(0,0,0,.08)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7"/>
          </svg>
        </button>
        <h1 className="font-display text-text text-xl font-bold">部屋を立てる</h1>
      </div>

      <div className="space-y-5">
        {/* 部屋の名前 */}
        <div className="space-y-2">
          <label className="text-xs font-black text-text-sub">部屋の名前</label>
          <div className="relative">
            <input
              className="w-full bg-surface rounded-2xl px-4 py-3.5 text-text text-[15px] font-bold placeholder:text-text-faint outline-none focus:border-[#E0A93B] transition-colors"
              style={{ border: "1px solid rgba(0,0,0,.1)" }}
              placeholder="例：金曜の夜の大喜利"
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-text-faint font-medium">
              {name.length}/16
            </span>
          </div>
        </div>

        {/* プレイモード */}
        <div className="space-y-2">
          <label className="text-xs font-black text-text-sub">プレイモード</label>
          <div className="bg-surface-2 rounded-2xl p-1 flex gap-1">
            {(["realtime", "async"] as Mode[]).map((m) => {
              const info = MODE_INFO[m];
              const selected = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 text-center rounded-[11px] py-2.5 text-[12.5px] font-bold transition-all active:scale-95 ${
                    selected ? "bg-[#1A1714] text-[#FBF7EC]" : "text-text-muted"
                  }`}
                >
                  {info.emoji} {info.title}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-text-muted">{MODE_INFO[mode].desc}</p>
        </div>

        {/* 審査AI */}
        <div className="space-y-2">
          <label className="text-xs font-black text-text-sub">審査AI</label>
          <div className="grid grid-cols-2 gap-3">
            {(["王道", "辛口"] as Judge[]).map((j) => {
              const info = JUDGE_INFO[j];
              const selected = judge === j;
              return (
                <button
                  key={j}
                  onClick={() => setJudge(j)}
                  className="rounded-2xl p-4 text-left transition-all active:scale-95"
                  style={selected
                    ? { border: `2px solid ${info.color}`, background: `${info.color}15` }
                    : { border: "1px solid rgba(0,0,0,.08)", background: "#fff", opacity: 0.6 }
                  }
                >
                  <p className="text-xl mb-1">{info.emoji}</p>
                  <p className="text-sm font-bold text-text">{info.title}</p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{info.desc}</p>
                  {selected && (
                    <div className="mt-2 text-[10px] font-black tracking-wide" style={{ color: info.color }}>
                      ✓ 選択中
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-pop-red">{error}</p>}

        <button
          onClick={create}
          disabled={!name.trim()}
          className="w-full text-[#FBF7EC] font-display font-bold py-4 rounded-2xl text-lg disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{ background: "#E5402F", boxShadow: "0 14px 26px -10px rgba(229,64,47,.6)" }}
        >
          のれんを掲げる
        </button>
      </div>
    </div>
  );
}
