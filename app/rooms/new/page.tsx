"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase/client";
import { getDoc, doc } from "firebase/firestore";
import { createRoom, generateInviteCode, generateRoomRef } from "@/lib/ogiri/rooms";
import type { GameMode } from "@/lib/types";
import Icon from "@/components/Icon";
import Engimono from "@/components/Engimono";

const GENRES = ["定番", "あるある", "写真で一言", "ブラック"] as const;
type Genre = typeof GENRES[number];

const GAME_MODES: { value: GameMode; label: string }[] = [
  { value: "classic", label: "定番" },
  { value: "ai_hunt", label: "AIハンター" },
  { value: "human_hunt", label: "人間ハンター" },
];

const GAME_MODE_DESC: Record<GameMode, string> = {
  classic: "みんなでお題に回答して座布団を競う、いつもの大喜利。",
  ai_hunt: "全員の回答にAIの回答を1つ紛れ込ませる。どれがAIか当てられるか？",
  human_hunt: "毎ラウンド1人だけが回答者に。AIの偽回答3つに紛れた本物を当てろ！",
};

const HIRAGANA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわ";

function generateHiraganaCode(): string {
  return Array.from({ length: 4 }, () => HIRAGANA[Math.floor(Math.random() * HIRAGANA.length)]).join("");
}

const ROOM_ADJECTIVES = ["福猫の", "笑門の", "千客万来", "縁起良し", "爆笑", "腹筋崩壊", "珍回答"];
const ROOM_NOUNS = ["大喜利茶屋", "大喜利座", "笑い処", "寄席", "お笑い道場", "爆笑亭", "一席"];

function generateRoomName(): string {
  const adj = ROOM_ADJECTIVES[Math.floor(Math.random() * ROOM_ADJECTIVES.length)];
  const noun = ROOM_NOUNS[Math.floor(Math.random() * ROOM_NOUNS.length)];
  return `${adj}${noun}`;
}

export default function NewRoomPage() {
  const router = useRouter();
  const [name, setName] = useState(generateRoomName);
  const [topicMode, setTopicMode] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<Genre>("定番");
  const [capacity, setCapacity] = useState(8);
  const [timeLimit, setTimeLimit] = useState(90);
  const [asyncHours, setAsyncHours] = useState(4);
  const [useCode, setUseCode] = useState(true);
  const [error, setError] = useState("");
  const [roomMode, setRoomMode] = useState<0 | 1>(0); // 0=realtime, 1=async
  const [aikotoba, setAikotoba] = useState(generateHiraganaCode);
  const [gameMode, setGameMode] = useState<GameMode>("classic");
  const [roundMultiplier, setRoundMultiplier] = useState(1);

  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!name.trim() || creating) return;
    const user = auth.currentUser;
    if (!user) { setError("未ログイン"); return; }

    setCreating(true);
    setError("");
    const inviteCode = useCode ? aikotoba : generateInviteCode();
    const roomRef = generateRoomRef();
    const roomId = roomRef.id;
    const topicModes = ["omakase", "custom", "mochiyori"] as const;
    const mode = gameMode === "classic" && roomMode === 1 ? "async" : "realtime";

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const nickname = userSnap.exists() ? (userSnap.data()?.nickname || user.displayName || "ゲスト") : (user.displayName ?? "ゲスト");
      await createRoom(
        user.uid, nickname, name.trim(), mode, ["王道", "辛口"], roomRef, inviteCode,
        topicModes[topicMode], capacity, timeLimit,
        gameMode, gameMode === "human_hunt" ? roundMultiplier : undefined,
      );
      router.push(`/rooms/${roomId}/invite?code=${inviteCode}`);
    } catch (e) {
      console.error("createRoom failed:", e);
      setError("部屋の作成に失敗しました。もう一度お試しください。");
      setCreating(false);
    }
  };

  const sliderPct = ((timeLimit - 30) / (180 - 30)) * 100;

  return (
    <div className="min-h-dvh flex flex-col bg-paper">
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
          <label className="block font-gothic font-extrabold text-[#1A1714] mb-[8px]" style={{ fontSize: 14 }}>部屋の名前</label>
          <div className="relative">
            <input
              className="w-full bg-white font-gothic font-bold text-[#1A1714] outline-none"
              style={{ border: "1px solid rgba(0,0,0,.07)", borderRadius: 14, padding: "13px 15px", fontSize: 15 }}
              placeholder="例：福猫の大喜利茶屋"
              maxLength={16}
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-gothic text-sub2" style={{ fontSize: 11 }}>
              {name.length}/16
            </span>
          </div>
        </div>

        {/* あそびかた */}
        <div>
          <label className="block font-gothic font-extrabold text-[#1A1714] mb-[8px]" style={{ fontSize: 14 }}>あそびかた</label>
          <div className="flex gap-[4px] p-[4px]" style={{ background: "#EBE2CF", borderRadius: 14 }}>
            {GAME_MODES.map((gm) => (
              <button
                key={gm.value}
                onClick={() => {
                  setGameMode(gm.value);
                  if (gm.value !== "classic" && topicMode === 2) setTopicMode(0);
                }}
                className="flex-1 text-center font-gothic"
                style={{
                  fontSize: 12.5, padding: "10px 0", borderRadius: 11,
                  background: gameMode === gm.value ? "#1A1714" : "transparent",
                  color: gameMode === gm.value ? "#FBF7EC" : "#7A6F5C",
                  fontWeight: gameMode === gm.value ? 700 : 600,
                }}
              >
                {gm.label}
              </button>
            ))}
          </div>
          <p className="font-gothic text-sub mt-2" style={{ fontSize: 11.5, lineHeight: 1.6 }}>
            {GAME_MODE_DESC[gameMode]}
          </p>
        </div>

        {/* 周回数（人間ハンターのみ） */}
        {gameMode === "human_hunt" && (
          <div style={{ background: "linear-gradient(100deg,#FFFDF5,#FFF9E8)", border: "1.5px dashed #E0A93B", borderRadius: 18, padding: 16 }}>
            <p className="font-gothic font-extrabold text-[#7A6F5C] mb-[10px]" style={{ fontSize: 12 }}>周回数（人数×◯周）</p>
            <div className="flex gap-[6px]">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRoundMultiplier(n)}
                  className="flex-1 text-center font-gothic font-bold"
                  style={{
                    fontSize: 13, padding: "8px 0", borderRadius: 10,
                    background: roundMultiplier === n ? "#E5402F" : "#ffffff",
                    color: roundMultiplier === n ? "#fff" : "#52493A",
                    border: roundMultiplier === n ? "none" : "1px solid rgba(0,0,0,.07)",
                  }}
                >
                  {n}周
                </button>
              ))}
            </div>
            <p className="font-gothic text-sub mt-2" style={{ fontSize: 10.5 }}>
              実際の参加人数×周回数がラウンド数になります（全員に均等に回答者が回ります）
            </p>
          </div>
        )}

        {/* お題のしくみ */}
        <div>
          <label className="block font-gothic font-extrabold text-[#1A1714] mb-[8px]" style={{ fontSize: 14 }}>お題のしくみ</label>
          <div className="flex gap-[4px] p-[4px]" style={{ background: "#EBE2CF", borderRadius: 14 }}>
            {["おまかせ", "自分でつくる", "持ち寄り"].map((label, i) => {
              const disabled = gameMode !== "classic" && i === 2;
              return (
                <button
                  key={i}
                  onClick={() => !disabled && setTopicMode(i)}
                  disabled={disabled}
                  className="flex-1 text-center font-gothic disabled:opacity-35"
                  style={{
                    fontSize: 13, padding: "10px 0", borderRadius: 11,
                    background: topicMode === i && !disabled ? "#1A1714" : "transparent",
                    color: topicMode === i && !disabled ? "#FBF7EC" : "#7A6F5C",
                    fontWeight: topicMode === i ? 700 : 600,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* モード */}
        <div>
          <label className="block font-gothic font-extrabold text-[#1A1714] mb-[8px]" style={{ fontSize: 14 }}>モード</label>
          <div className="flex gap-[4px] p-[4px]" style={{ background: "#EBE2CF", borderRadius: 14, opacity: gameMode === "classic" ? 1 : 0.4 }}>
            {["リアルタイム", "非同期"].map((label, i) => (
              <button
                key={i}
                onClick={() => gameMode === "classic" && setRoomMode(i as 0 | 1)}
                disabled={gameMode !== "classic"}
                className="flex-1 text-center font-gothic"
                style={{
                  fontSize: 13, padding: "10px 0", borderRadius: 11,
                  background: (gameMode === "classic" ? roomMode : 0) === i ? "#1A1714" : "transparent",
                  color: (gameMode === "classic" ? roomMode : 0) === i ? "#FBF7EC" : "#7A6F5C",
                  fontWeight: roomMode === i ? 700 : 600,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {gameMode !== "classic" && (
            <p className="font-gothic text-sub mt-2" style={{ fontSize: 11 }}>
              このあそびかたはまずリアルタイムモードのみ対応しています
            </p>
          )}
        </div>

        {/* ジャンル */}
        <div>
          <label className="block font-gothic font-extrabold text-[#1A1714] mb-[8px]" style={{ fontSize: 14 }}>ジャンル</label>
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
                className="grid place-items-center"
                style={{ width: 32, height: 32, borderRadius: 999, background: "#EBE2CF" }}
              >
                <svg width="14" height="2" viewBox="0 0 14 2" stroke="#1A1714" strokeWidth="2" strokeLinecap="round"><line x1="0" y1="1" x2="14" y2="1" /></svg>
              </button>
              <span className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 20 }}>
                {capacity}<span className="font-gothic" style={{ fontSize: 14, fontWeight: 500, color: "#7A6F5C" }}>人</span>
              </span>
              <button
                onClick={() => setCapacity((c) => Math.min(10, c + 1))}
                className="grid place-items-center"
                style={{ width: 32, height: 32, borderRadius: 999, background: "#EBE2CF" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" stroke="#1A1714" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="0" x2="7" y2="14" /><line x1="0" y1="7" x2="14" y2="7" /></svg>
              </button>
            </div>
          </div>

          {/* 制限時間 */}
          <div className="flex-1 bg-white" style={{ border: "1px solid rgba(0,0,0,.07)", borderRadius: 14, padding: "12px 14px" }}>
            <p className="font-gothic text-sub mb-2" style={{ fontSize: 11 }}>
              {roomMode === 0 ? "回答の制限時間" : "回答の締切"}
            </p>
            {roomMode === 0 ? (
              <>
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
              </>
            ) : (
              <>
                <p className="font-mincho font-extrabold text-[#1A1714] mb-2" style={{ fontSize: 20 }}>{asyncHours} 時間</p>
                <div className="flex flex-wrap gap-[6px]">
                  {[2, 4, 6, 8, 12, 24].map((h) => (
                    <button
                      key={h}
                      onClick={() => setAsyncHours(h)}
                      className="font-gothic font-bold"
                      style={{
                        fontSize: 12, padding: "5px 10px", borderRadius: 999,
                        background: asyncHours === h ? "#E5402F" : "#EBE2CF",
                        color: asyncHours === h ? "#FBF7EC" : "#52493A",
                      }}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* あいことば */}
        <div style={{ background: "linear-gradient(100deg,#FFFDF5,#FFF9E8)", border: "1.5px dashed #E0A93B", borderRadius: 18, padding: 16 }}>
          <div className="flex items-center justify-between mb-[10px]">
            <p className="font-gothic font-extrabold text-[#7A6F5C]" style={{ fontSize: 12 }}>あいことば（合言葉のみ入室）</p>
            <button
              onClick={() => setUseCode((v) => !v)}
              className="relative shrink-0"
              style={{ width: 46, height: 27, borderRadius: 999, background: useCode ? "#2BA35F" : "#E4DCCF" }}
            >
              <span
                className="absolute top-[3px] bg-white rounded-full"
                style={{ width: 21, height: 21, right: useCode ? 3 : undefined, left: useCode ? undefined : 3 }}
              />
            </button>
          </div>
          <div className="flex items-center gap-[10px]">
            <div className="grid place-items-center" style={{ width: 32, height: 32 }}>
              <Engimono name="koban" width={18} height={26} />
            </div>
            <input
              className="flex-1 bg-transparent font-mincho font-extrabold text-[#1A1714] outline-none"
              style={{ fontSize: 22, letterSpacing: "0.15em" }}
              value={aikotoba}
              onChange={(e) => setAikotoba(e.target.value)}
              maxLength={8}
            />
            <button
              onClick={() => setAikotoba(generateHiraganaCode())}
              className="shrink-0 grid place-items-center"
              style={{ width: 32, height: 32 }}
              aria-label="あいことばを再生成"
            >
              <Icon name="refresh" size={20} color="#9A6410" strokeWidth={2} />
            </button>
          </div>
        </div>

        {error && <p className="font-gothic text-red text-sm">{error}</p>}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 px-[20px] pb-[100px] pt-[10px] bg-paper">
        <button
          onClick={create}
          disabled={!name.trim() || creating}
          className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{ fontSize: 18, padding: "16px 0", borderRadius: 18, background: "#E5402F", boxShadow: "0 14px 26px -10px rgba(229,64,47,0.6)" }}
        >
          {creating ? "作成中…" : "のれんを掲げる"}
        </button>
      </div>
    </div>
  );
}
