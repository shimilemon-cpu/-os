"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { subscribeRoom, subscribeMembers, setMemberReady, startGame } from "@/lib/ogiri/rooms";
import { createSession, createRound, getActiveSession } from "@/lib/ogiri/sessions";
import type { RoomDoc, RoomMemberDoc } from "@/lib/types";
import { Copy, Check } from "lucide-react";

const ANSWER_SECONDS = 90;

export default function WaitingRoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [members, setMembers] = useState<RoomMemberDoc[]>([]);
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);
  const uid = auth.currentUser?.uid ?? "";

  useEffect(() => {
    const unsub1 = subscribeRoom(roomId, (r) => {
      setRoom(r);
      // If game started, navigate to game
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
      // Generate first question
      const res = await fetch("/api/ogiri/question", { method: "POST", body: JSON.stringify({}) });
      const data = await res.json() as { question: string; genre: string; difficulty: string };
      await createRound(sessionId, 1, {
        text: data.question,
        genre: data.genre as never,
        difficulty: data.difficulty as never,
      }, ANSWER_SECONDS);
      await startGame(roomId);
      router.push(`/rooms/${roomId}/game?sid=${sessionId}`);
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  }, [room, roomId, router]);

  const isHost = room?.hostId === uid;
  const me = members.find((m) => m.userId === uid);
  const allReady = members.length >= 2 && members.every((m) => m.isReady || m.userId === uid);
  const readyCount = members.filter((m) => m.isReady).length;

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-12">
      <h1 className="serif text-[var(--accent)] text-2xl font-bold mb-1">{room.name}</h1>
      <p className="text-[var(--muted)] text-xs mb-8">
        {room.mode === "realtime" ? "⚡ リアルタイム" : "⏰ 非同期"} モード
      </p>

      {/* 招待リンク */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 mb-6 space-y-3">
        <p className="text-xs text-[var(--muted)]">招待コード</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold tracking-[0.3em] text-[var(--text)]">
            {room.inviteCode}
          </span>
          <button
            onClick={copyInvite}
            className="flex items-center gap-1.5 text-xs text-[var(--accent)] border border-[var(--accent)]/40 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "コピー済み" : "リンクをコピー"}
          </button>
        </div>
      </div>

      {/* メンバーリスト */}
      <div className="space-y-2 mb-8">
        <p className="text-xs text-[var(--muted)] tracking-wide">
          メンバー {members.length}/5 — {readyCount}人準備完了
        </p>
        {members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text)]">{m.nickname}</span>
              {m.userId === room.hostId && (
                <span className="text-[10px] text-[var(--accent)] border border-[var(--accent)]/40 px-1.5 py-0.5 rounded-full">
                  ホスト
                </span>
              )}
            </div>
            <span className={`text-xs font-medium ${m.isReady ? "text-[var(--ok)]" : "text-[var(--muted)]"}`}>
              {m.isReady ? "✓ 準備OK" : "待機中"}
            </span>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="space-y-3">
        {!isHost && (
          <button
            onClick={toggleReady}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
              me?.isReady
                ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]"
                : "bg-[var(--ok)]/20 border border-[var(--ok)]/60 text-[var(--ok)]"
            }`}
          >
            {me?.isReady ? "準備を取り消す" : "準備完了！"}
          </button>
        )}

        {isHost && (
          <button
            onClick={handleStart}
            disabled={members.length < 2 || !allReady || starting}
            className="w-full bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-2xl text-base disabled:opacity-40 active:scale-[0.98] transition-all"
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
