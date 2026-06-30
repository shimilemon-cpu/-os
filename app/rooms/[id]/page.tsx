"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { subscribeRoom, subscribeMembers, setMemberReady, startGame } from "@/lib/ogiri/rooms";
import { createSession, createRound, getActiveSession } from "@/lib/ogiri/sessions";
import type { RoomDoc, RoomMemberDoc } from "@/lib/types";
import AdSlot from "@/components/AdSlot";

type QuestionData = { question: string; genre: string; difficulty: string };

function prefetchQuestion(): Promise<QuestionData> {
  return fetch("/api/ogiri/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).then((r) => r.json() as Promise<QuestionData>);
}

const ANSWER_SECONDS = 90;
const CHAR_SYMBOLS = ["#c-daruma", "#c-cat", "#c-tai", "#c-fuku", "#c-mask"] as const;
const CHAR_BG = ["#FCE8E3", "#EAF7EF", "#FDEFE0", "#FFF3D6", "#E8F0FC"] as const;

export default function WaitingRoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [members, setMembers] = useState<RoomMemberDoc[]>([]);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const [uid, setUid] = useState(auth.currentUser?.uid ?? "");
  const prefetchRef = useRef<Promise<QuestionData> | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => setUid(user?.uid ?? ""));
  }, []);

  useEffect(() => {
    const unsub1 = subscribeRoom(roomId, (r) => {
      setRoom(r);
      if (r.status === "active") {
        getActiveSession(roomId).then((session) => {
          if (session) router.push(`/rooms/${roomId}/game?sid=${session.id}`);
        });
      }
    });
    const unsub2 = subscribeMembers(roomId, setMembers);
    return () => { unsub1(); unsub2(); };
  }, [roomId, router]);

  const copyInvite = async () => {
    if (!room) return;
    const link = `${window.location.origin}/invite/${room.inviteCode}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleReady = () => {
    const me = members.find((m) => m.userId === uid);
    if (me) setMemberReady(roomId, uid, !me.isReady);
  };

  const handleStart = useCallback(async () => {
    if (!room) return;
    setStarting(true);
    try {
      const sessionId = await createSession(roomId, 5);
      const data = await (prefetchRef.current ?? prefetchQuestion());
      await createRound(sessionId, 1, {
        text: data.question,
        genre: data.genre as never,
        difficulty: data.difficulty as never,
      }, ANSWER_SECONDS);
      await startGame(roomId);
      prefetchRef.current = null;
      router.push(`/rooms/${roomId}/game?sid=${sessionId}`);
    } catch (e) {
      console.error(e);
      prefetchRef.current = null;
      setStarting(false);
    }
  }, [room, roomId, router]);

  const isHost = room?.hostId === uid;
  const me = members.find((m) => m.userId === uid);

  useEffect(() => {
    if (isHost && !prefetchRef.current) {
      prefetchRef.current = prefetchQuestion();
    }
  }, [isHost]);

  const allReady = members.length >= 2 && members.every((m) => m.isReady || m.userId === uid);
  const readyCount = members.filter((m) => m.isReady).length;

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="w-8 h-8 rounded-full border-2 border-pop-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-10 bg-ink">
      {/* ルーム名 */}
      <div className="mb-6">
        <p className="text-text-muted text-[11px] mb-1">
          {room.mode === "realtime" ? "⚡ リアルタイム" : "⏰ 非同期"}モード
        </p>
        <h1 className="font-display text-text text-2xl font-bold">{room.name}</h1>
      </div>

      {/* あいことば */}
      <div className="bg-surface rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,0,0,.07)" }}>
        <p className="text-xs text-text-muted font-bold mb-3">友達を招待</p>
        <div className="text-center mb-4">
          <span className="font-display text-4xl tracking-[0.4em] font-bold" style={{ color: "#E5402F" }}>
            {room.inviteCode}
          </span>
        </div>
        <button
          onClick={copyInvite}
          className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-xl active:scale-95 transition-transform font-medium"
          style={{ border: "1px solid rgba(0,0,0,.1)", color: copied ? "#2BA35F" : "#1A1714" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {copied ? <path d="M5 13l5 5L19 6"/> : <><rect x="4" y="4" width="11" height="11" rx="2.5"/><rect x="9" y="9" width="11" height="11" rx="2.5"/></>}
          </svg>
          {copied ? "コピーしました！" : "招待リンクをコピー"}
        </button>
      </div>

      {/* メンバーリスト */}
      <div className="space-y-2.5 mb-5">
        <p className="text-xs text-text-muted font-bold">
          メンバー {members.length}/5 — {readyCount}人準備完了
        </p>
        {members.map((m, i) => (
          <div
            key={m.userId}
            className="flex items-center gap-3 bg-surface rounded-[15px] px-4 py-3 animate-rise"
            style={{ border: "1px solid rgba(0,0,0,.07)" }}
          >
            <div className="w-8 h-9 flex-none grid place-items-center rounded-xl" style={{ background: CHAR_BG[i % CHAR_BG.length] }}>
              <svg className="w-7 h-8">
                <use href={CHAR_SYMBOLS[i % CHAR_SYMBOLS.length]} width="100%" height="100%"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-text">{m.nickname}</p>
              {m.userId === room.hostId && (
                <span className="text-[10px] text-pop-gold font-black">ホスト</span>
              )}
            </div>
            <span
              className="text-xs font-black"
              style={{ color: m.isReady ? "#2BA35F" : "#B6AC97" }}
            >
              {m.isReady ? "✓ 準備OK" : "待機中"}
            </span>
          </div>
        ))}
      </div>

      <AdSlot id="lobby-banner" className="mb-5" />

      {/* アクションボタン */}
      <div className="space-y-3">
        {!isHost && (
          <button
            onClick={toggleReady}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98]"
            style={me?.isReady
              ? { background: "#fff", border: "1px solid rgba(0,0,0,.1)", color: "#7A6F5C" }
              : { background: "#E6F5EC", border: "2px solid #2BA35F", color: "#2BA35F" }
            }
          >
            {me?.isReady ? "準備を取り消す" : "準備完了！"}
          </button>
        )}

        {isHost && (
          <button
            onClick={handleStart}
            disabled={members.length < 2 || !allReady || starting}
            className="w-full font-display font-bold py-4 rounded-2xl text-lg disabled:opacity-40 active:scale-[0.98] transition-all text-[#FBF7EC]"
            style={{ background: "#2BA35F", boxShadow: "0 14px 26px -10px rgba(43,163,95,.6)" }}
          >
            {starting
              ? "お題を生成中…"
              : members.length < 2
              ? "あと1人招待してください"
              : !allReady
              ? `全員の準備を待っています (${readyCount}/${members.length})`
              : "大喜利、始め！"}
          </button>
        )}
      </div>
    </div>
  );
}
