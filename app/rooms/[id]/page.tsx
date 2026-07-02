"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { subscribeRoom, subscribeMembers, setMemberReady, startGame } from "@/lib/ogiri/rooms";
import { createSession, createRound, getActiveSession } from "@/lib/ogiri/sessions";
import type { RoomDoc, RoomMemberDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";

type QuestionData = { question: string; genre: string; difficulty: string };

function prefetchQuestion(): Promise<QuestionData> {
  return fetch("/api/ogiri/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).then((r) => r.json() as Promise<QuestionData>);
}

const ANSWER_SECONDS = 90;
const CHARM_NAMES = ["daruma", "cat", "tai", "fuku", "mask"] as const;
const CHARM_BG = ["#FCE8E3", "#EAF7EF", "#FDEFE0", "#FFF3D6", "#E8F0FC"] as const;

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
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper bg-asanoha pb-[20px]">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[10px] flex items-center gap-[12px]">
        <div className="flex-1">
          <div className="inline-flex items-center gap-[6px] mb-1">
            <span
              className="font-gothic font-extrabold"
              style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: room.mode === "async" ? "#EBE2CF" : "#FCE7E3", color: room.mode === "async" ? "#7A6F5C" : "#E5402F" }}
            >
              {room.mode === "async" ? "⏰ 非同期" : "⚡ リアルタイム"}
            </span>
            <span className="font-gothic text-sub" style={{ fontSize: 10 }}>{members.length}/5人</span>
          </div>
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 22, lineHeight: 1.1 }}>{room.name}</p>
        </div>
        <Engimono name="mallet" width={44} height={44} style={{ opacity: 0.9 }} />
      </div>

      {/* あいことばカード */}
      <div className="mx-[20px] mb-[14px] relative">
        <div
          className="relative overflow-hidden"
          style={{ borderRadius: 20, padding: "16px 18px 14px", background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)", border: "1.5px dashed #E0A93B" }}
        >
          <Engimono name="koban" width={44} height={29} style={{ position: "absolute", top: 10, right: 12, opacity: 0.7 }} />
          <p className="font-gothic font-extrabold text-[#9A6410]" style={{ fontSize: 10, letterSpacing: "0.14em" }}>＼ あいことばで招待 ／</p>
          <p
            className="font-mincho font-extrabold text-center tracking-[0.4em] mt-1 mb-2"
            style={{ fontSize: 36, color: "#E5402F", textShadow: "0 2px 0 rgba(229,64,47,.15)" }}
          >
            {room.inviteCode}
          </p>
          <button
            onClick={copyInvite}
            className="w-full flex items-center justify-center gap-2 font-gothic font-bold active:scale-95 transition-transform"
            style={{
              fontSize: 12, padding: "9px 0", borderRadius: 10,
              border: "1px solid rgba(0,0,0,.1)",
              color: copied ? "#2BA35F" : "#1A1714",
              background: "rgba(255,255,255,.7)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {copied ? <path d="M5 13l5 5L19 6"/> : <><rect x="4" y="4" width="11" height="11" rx="2.5"/><rect x="9" y="9" width="11" height="11" rx="2.5"/></>}
            </svg>
            {copied ? "コピーしました！" : "招待リンクをコピー"}
          </button>
        </div>
      </div>

      {/* メンバーリスト */}
      <div className="px-[20px] flex flex-col gap-[7px] mb-[14px]">
        <div className="flex items-center gap-[8px]">
          <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
          <p className="font-mincho font-extrabold text-sub" style={{ fontSize: 11, letterSpacing: "0.16em" }}>
            ◆ メンバー {members.length}/5 ・ 準備完了 {readyCount}人
          </p>
          <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
        </div>
        {members.map((m, i) => (
          <div
            key={m.userId}
            className="bg-white flex items-center gap-[12px] animate-rise"
            style={{ borderRadius: 15, padding: "11px 14px", border: "1px solid rgba(0,0,0,.07)" }}
          >
            <div
              className="shrink-0 grid place-items-center"
              style={{ width: 38, height: 38, borderRadius: 13, background: CHARM_BG[i % CHARM_BG.length] }}
            >
              <Engimono name={CHARM_NAMES[i % CHARM_NAMES.length]} width={28} height={31} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 14 }}>{m.nickname}</p>
              {m.userId === room.hostId && (
                <span className="font-gothic font-extrabold" style={{ fontSize: 10, color: "#E0A93B" }}>ホスト</span>
              )}
            </div>
            <span
              className="font-gothic font-extrabold shrink-0"
              style={{ fontSize: 12, color: m.isReady ? "#2BA35F" : "#B6AC97" }}
            >
              {m.isReady ? "✓ 準備OK" : "待機中"}
            </span>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="px-[20px] flex flex-col gap-[10px] mt-auto">
        {!isHost && (
          <button
            onClick={toggleReady}
            className="w-full font-mincho font-extrabold active:scale-[0.98] transition-all"
            style={{
              fontSize: 17, padding: "16px 0", borderRadius: 18,
              ...(me?.isReady
                ? { background: "#fff", border: "1px solid rgba(0,0,0,.1)", color: "#7A6F5C" }
                : { background: "#E6F5EC", border: "2px solid #2BA35F", color: "#2BA35F" }),
            }}
          >
            {me?.isReady ? "準備を取り消す" : "準備完了！"}
          </button>
        )}

        {isHost && (
          <button
            onClick={handleStart}
            disabled={members.length < 2 || !allReady || starting}
            className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-all"
            style={{ fontSize: 18, padding: "16px 0", borderRadius: 18, background: "#2BA35F", boxShadow: "0 14px 26px -10px rgba(43,163,95,.6)" }}
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
