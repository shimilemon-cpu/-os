"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { subscribeRoom, subscribeMembers, setMemberReady, startGame } from "@/lib/ogiri/rooms";
import { createSession, createRound, getActiveSession } from "@/lib/ogiri/sessions";
import type { RoomDoc, RoomMemberDoc } from "@/lib/types";
import Mascot from "@/components/Mascot";
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
const CHAR_KINDS = ["char_yellow", "char_pink", "char_teal", "char_purple", "char_green"] as const;

export default function WaitingRoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [members, setMembers] = useState<RoomMemberDoc[]>([]);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const uid = auth.currentUser?.uid ?? "";
  const prefetchRef = useRef<Promise<QuestionData> | null>(null);

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

  // ロビー表示中にQ1を先読みしておく
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
        <div className="w-8 h-8 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-12">
      <h1 className="font-display text-pop-yellow text-2xl mb-1">{room.name}</h1>
      <p className="text-zinc-500 text-xs mb-8">
        {room.mode === "realtime" ? "⚡ リアルタイム" : "⏰ 非同期"} モード
      </p>

      {/* 招待コード */}
      <div className="bg-surface border border-line rounded-2xl p-5 mb-6">
        <p className="text-xs text-zinc-500 mb-3">友達を招待</p>
        <div className="text-center mb-4">
          <span className="font-display text-4xl tracking-[0.4em] text-white">
            {room.inviteCode}
          </span>
        </div>
        <button
          onClick={copyInvite}
          className="w-full flex items-center justify-center gap-2 border border-pop-yellow/40 text-pop-yellow text-sm py-2.5 rounded-xl active:scale-95 transition-transform"
        >
          <Mascot kind={copied ? "check" : "copy"} size={14} tint="#FFD600" />
          {copied ? "コピーしました！" : "招待リンクをコピー"}
        </button>
      </div>

      {/* メンバーリスト */}
      <div className="space-y-2 mb-8">
        <p className="text-xs text-zinc-500 tracking-wide">
          メンバー {members.length}/5 — {readyCount}人準備完了
        </p>
        {members.map((m, i) => (
          <div
            key={m.userId}
            className="flex items-center justify-between bg-surface border border-line rounded-xl px-4 py-3 animate-rise"
          >
            <div className="flex items-center gap-3">
              <Mascot kind={CHAR_KINDS[i % CHAR_KINDS.length]} size={32} />
              <div>
                <p className="text-sm text-white">{m.nickname}</p>
                {m.userId === room.hostId && (
                  <span className="text-[10px] text-pop-yellow">ホスト</span>
                )}
              </div>
            </div>
            <span className={`text-xs font-bold ${m.isReady ? "text-pop-green" : "text-zinc-600"}`}>
              {m.isReady ? "✓ 準備OK" : "待機中"}
            </span>
          </div>
        ))}
      </div>

      <AdSlot id="lobby-banner" className="mb-6" />

      {/* アクションボタン */}
      <div className="space-y-3">
        {!isHost && (
          <button
            onClick={toggleReady}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
              me?.isReady
                ? "bg-surface border border-line text-zinc-500"
                : "bg-pop-green/20 border border-pop-green/60 text-pop-green animate-green-glow"
            }`}
          >
            {me?.isReady ? "準備を取り消す" : "準備完了！"}
          </button>
        )}

        {isHost && (
          <button
            onClick={handleStart}
            disabled={members.length < 2 || !allReady || starting}
            className="w-full bg-pop-yellow text-ink font-bold py-4 rounded-2xl text-base disabled:opacity-40 active:scale-[0.98] transition-all animate-pulse-glow"
          >
            {starting
              ? "お題を生成中..."
              : members.length < 2
              ? "あと1人招待してください"
              : !allReady
              ? `全員の準備を待っています (${readyCount}/${members.length})`
              : "ゲームを開始！"}
          </button>
        )}
      </div>
    </div>
  );
}
