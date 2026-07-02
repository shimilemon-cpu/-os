"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { createRoom, generateInviteCode, generateRoomRef } from "@/lib/ogiri/rooms";
import Icon from "@/components/Icon";
import Engimono from "@/components/Engimono";

const GENRES = ["定番", "あるある", "日常", "ブラック"] as const;
type Genre = typeof GENRES[number];

export default function NewRoomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [topicMode, setTopicMode] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<Genre>("定番");
  const [capacity, setCapacity] = useState(8);
  const [timeLimit, setTimeLimit] = useState(90);
  const [useCode, setUseCode] = useState(true);
  const [error, setError] = useState("");

  const create = () => {
    if (!name.trim()) return;
    const user = auth.currentUser;
    if (!user) { setError("未ログイン"); return; }

    const inviteCode = generateInviteCode();
    const roomRef = generateRoomRef();
    const roomId = roomRef.id;

    router.push(`/rooms/${roomId}/invite?code=${inviteCode}`);

    const topicModes = ["omakase", "custom", "mochiyori"] as const;
    createRoom(user.uid, user.displayName ?? "ゲスト", name.trim(), "realtime", ["王道", "辛口"], roomRef, inviteCode, topicModes[topicMode])
      .catch((e) => console.error("createRoom failed:", e));
  };

  const sliderPct = ((timeLimit - 30) / (180 - 30)) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[14px] flex items-center gap-[10px]">
        <button
          onClick={() => router.back()}
          className="grid place-items-center bg-white"
          style={{ width: 38, height: 38, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
        >
          <Icon name="back" size={18} color="#1A1714" strokeWidth={2.4} />
        </button>
        <h1 className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 21 }}>部屋を立てる</h1>
      </div>

      {/* Body */}
      <div className="flex-1 px-[20px] pb-[18px] flex flex-col gap-[16px]">

        {/* 部屋の名前 */}
        <div>
          <label className="block font-gothic font-extrabold text-[#52493A] mb-[7px]" style={{ fontSize: 12 }}>部屋の名前</label>
          <div className="relative">
            <input
              className="w-full bg-white font-gothic font-bold text-[#1A1714] outline-none"
              style={{ border: "1px solid rgba(0,0,0,.07)", borderRadius: 14, padding: "13px 15px", fontSize: 15 }}
              placeholder="例：福猫の大喜利茶屋"
              maxLength={16}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-gothic text-sub2" style={{ fontSize: 11 }}>
              {name.length}/16
            </span>
          </div>
        </div>

        {/* お題のしくみ */}
        <div>
          <label className="block font-gothic font-extrabold text-[#52493A] mb-[7px]" style={{ fontSize: 12 }}>お題のしくみ</label>
          <div className="flex gap-[4px] p-[4px]" style={{ background: "#EBE2CF", borderRadius: 14 }}>
            {["おまかせ", "自分でつくる", "持ち寄り"].map((label, i) => (
              <button
                key={i}
                onClick={() => setTopicMode(i)}
                className="flex-1 text-center font-gothic"
                style={{
                  fontSize: 13, padding: "8px 0", borderRadius: 11,
                  background: topicMode === i ? "#1A1714" : "transparent",
                  color: topicMode === i ? "#FBF7EC" : "#7A6F5C",
                  fontWeight: topicMode === i ? 700 : 600,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ジャンル */}
        <div>
          <label className="block font-gothic font-extrabold text-[#52493A] mb-[7px]" style={{ fontSize: 12 }}>ジャンル</label>
          <div className="flex flex-wrap gap-[8px]">
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className="font-gothic font-bold"
                style={{
                  fontSize: 12.5, padding: "7px 13px", borderRadius: 999,
                  background: selectedGenre === g ? "#2BA35F" : "#ffffff",
                  color: selectedGenre === g ? "#ffffff" : "#52493A",
                  border: selectedGenre === g ? "none" : "1px solid rgba(0,0,0,.07)",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 定員 & 制限時間 */}
        <div className="flex gap-[12px]">
          {/* 定員 */}
          <div className="flex-1 bg-white" style={{ border: "1px solid rgba(0,0,0,.07)", borderRadius: 14, padding: "12px 14px" }}>
            <p className="font-gothic text-sub mb-2" style={{ fontSize: 11 }}>定員</p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCapacity((c) => Math.max(2, c - 1))}
                className="grid place-items-center font-gothic text-sub"
                style={{ width: 26, height: 26, borderRadius: 8, background: "#EFE8DA", fontSize: 16, fontWeight: 700 }}
              >
                −
              </button>
              <span className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 20 }}>{capacity}人</span>
              <button
                onClick={() => setCapacity((c) => Math.min(10, c + 1))}
                className="grid place-items-center font-gothic text-paper"
                style={{ width: 26, height: 26, borderRadius: 8, background: "#1A1714", fontSize: 16, fontWeight: 700 }}
              >
                ＋
              </button>
            </div>
          </div>

          {/* 制限時間 */}
          <div className="flex-1 bg-white" style={{ border: "1px solid rgba(0,0,0,.07)", borderRadius: 14, padding: "12px 14px" }}>
            <p className="font-gothic text-sub mb-2" style={{ fontSize: 11 }}>回答の制限時間</p>
            <p className="font-mincho font-extrabold text-[#1A1714] mb-2" style={{ fontSize: 20 }}>{timeLimit} 秒</p>
            <div className="relative" style={{ height: 5, background: "#EBE2CF", borderRadius: 9 }}>
              <div style={{ width: `${sliderPct}%`, height: "100%", background: "#E5402F", borderRadius: 9 }} />
              <div
                className="absolute top-1/2 bg-white"
                style={{ left: `${sliderPct}%`, transform: "translate(-50%,-50%)", width: 14, height: 14, borderRadius: "50%", border: "3px solid #E5402F" }}
              />
              <input
                type="range" min={30} max={180} step={15}
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
              />
            </div>
          </div>
        </div>

        {/* あいことば */}
        <div
          className="flex items-center gap-[12px]"
          style={{ background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)", border: "1px solid #E0A93B", borderRadius: 16, padding: 14 }}
        >
          <Engimono name="koban" width={38} height={24} />
          <div className="flex-1">
            <p className="font-gothic font-extrabold text-[#9A6410]" style={{ fontSize: 11 }}>あいことば</p>
            <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 22, letterSpacing: "0.18em" }}>ふくねこ</p>
          </div>
          <button
            onClick={() => setUseCode((v) => !v)}
            className="relative"
            style={{ width: 46, height: 27, borderRadius: 999, background: useCode ? "#2BA35F" : "#E4DCCF" }}
          >
            <span
              className="absolute top-[3px] bg-white rounded-full"
              style={{ width: 21, height: 21, right: useCode ? 3 : undefined, left: useCode ? undefined : 3 }}
            />
          </button>
        </div>

        {error && <p className="font-gothic text-red text-sm">{error}</p>}
      </div>

      {/* Footer */}
      <div className="px-[20px] pb-[26px]">
        <button
          onClick={create}
          disabled={!name.trim()}
          className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{ fontSize: 18, padding: "16px 0", borderRadius: 18, background: "#E5402F", boxShadow: "0 14px 26px -10px rgba(229,64,47,0.6)" }}
        >
          のれんを掲げる
        </button>
      </div>
    </div>
  );
}
