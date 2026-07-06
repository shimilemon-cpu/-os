"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { auth } from "@/lib/firebase/client";
import {
  subscribeSession, subscribeRound, subscribeAnswers, submitAnswer,
  transitionPhase, advanceAsyncRoundToVoting, getTimestampMs,
  getUserAnsweredRounds,
} from "@/lib/ogiri/sessions";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import type { SessionDoc, RoundDoc, RoomDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import OdaiSheet from "@/components/OdaiSheet";
import AsyncGameHub from "./AsyncGameHub";

const VOTE_SECONDS = 45;

function TimerRing({ deadline, totalSeconds, onExpire }: { deadline: RoundDoc["answerDeadline"] | null; totalSeconds: number; onExpire?: () => void }) {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const dl = deadline as { toDate?: () => Date; seconds?: number };
    const end = typeof dl.toDate === "function" ? dl.toDate().getTime()
      : typeof dl.seconds === "number" ? dl.seconds * 1000 : 0;
    if (!end) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecs(remaining);
      if (remaining === 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  if (secs === null) return null;

  const CIRC = 2 * Math.PI * 21;
  const pct = Math.max(0, Math.min(1, secs / totalSeconds));
  const offset = CIRC * (1 - pct);
  const color = secs > 30 ? "#1A1714" : secs > 10 ? "#F4C422" : "#E5402F";

  return (
    <div className="relative" style={{ width: 50, height: 50, flexShrink: 0 }}>
      <svg width="50" height="50" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="21" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="5"/>
        <circle
          cx="25" cy="25" r="21"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          transform="rotate(-90 25 25)"
          style={{ transition: "stroke-dashoffset 0.5s linear" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mincho font-extrabold"
        style={{ fontSize: 14, color }}
      >
        {secs}
      </span>
    </div>
  );
}

function AsyncDeadlineBadge({ deadline }: { deadline: RoundDoc["answerDeadline"] | null }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const end = getTimestampMs(deadline as { toDate?: () => Date; seconds?: number } | null);
      if (!end) { setRemaining(""); return; }
      const diff = Math.max(0, end - Date.now());
      if (diff === 0) { setRemaining("期限切れ"); return; }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(h > 0 ? `あと${h}時間${m > 0 ? `${m}分` : ""}` : `あと${m}分`);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!remaining) return null;
  return (
    <span
      className="font-gothic font-extrabold"
      style={{
        fontSize: 11,
        padding: "4px 10px",
        borderRadius: 999,
        background: "#EBE2CF",
        color: "#7A6F5C",
      }}
    >
      {remaining}
    </span>
  );
}

function GamePageContent() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") ?? "";
  const roundParam = searchParams.get("round");
  const router = useRouter();

  const [session, setSession] = useState<SessionDoc | null>(null);
  const [round, setRound] = useState<RoundDoc | null>(null);
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const uid = auth.currentUser?.uid ?? "";
  const isHost = room?.hostId === uid;
  const advancingRef = useRef(false);

  const isAsync = session?.mode === "async";

  useEffect(() => {
    const u1 = subscribeRoom(roomId, setRoom);
    const u2 = subscribeSession(sessionId, (s) => {
      setSession(s);
      if (s.mode === "async") {
        if (s.status === "finished") {
          router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
        }
        return;
      }
      // Realtime navigation
      if (s.status === "voting") {
        router.replace(`/rooms/${roomId}/game/vote?sid=${sessionId}&round=${s.currentRound}`);
      }
      if (s.status === "finished") {
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
      }
    });
    return () => { u1(); u2(); };
  }, [roomId, sessionId, router]);

  const activeRoundId = isAsync ? roundParam : session ? String(session.currentRound) : null;

  useEffect(() => {
    if (!activeRoundId) return;
    const u = subscribeRound(sessionId, activeRoundId, (r) => {
      setRound(r);
      if (isAsync) {
        if (r.status === "voting") {
          router.replace(`/rooms/${roomId}/game/vote?sid=${sessionId}&round=${r.id}`);
        }
        if (r.status === "reviewing" || r.status === "done") {
          router.replace(`/rooms/${roomId}/game/result?sid=${sessionId}&round=${r.id}`);
        }
      }
    });
    setSubmitted(false);
    setAnswer("");
    return u;
  }, [sessionId, activeRoundId, isAsync, roomId, router]);

  // Check if user already answered this round (for async)
  useEffect(() => {
    if (!isAsync || !activeRoundId || !uid || !session) return;
    getUserAnsweredRounds(sessionId, uid, session.totalRounds).then((set) => {
      if (set.has(activeRoundId)) {
        setSubmitted(true);
      }
    });
  }, [isAsync, activeRoundId, uid, sessionId, session]);

  const advanceToVoting = useCallback(async () => {
    if (!session || advancingRef.current) return;
    if (round?.status !== "answering") return;

    if (isAsync) {
      advancingRef.current = true;
      try {
        await advanceAsyncRoundToVoting(sessionId, activeRoundId!);
      } finally {
        advancingRef.current = false;
      }
      return;
    }

    // Realtime logic
    const isDeadlinePastNow = (() => {
      const dl = round.answerDeadline;
      if (!dl) return false;
      const tsObj = dl as { toDate?: () => Date; seconds?: number };
      const end = typeof tsObj.toDate === "function" ? tsObj.toDate().getTime()
        : typeof tsObj.seconds === "number" ? tsObj.seconds * 1000 : 0;
      return end > 0 && Date.now() >= end;
    })();
    if (!isHost && !isDeadlinePastNow) return;
    advancingRef.current = true;
    try {
      const voteDeadline = Timestamp.fromDate(new Date(Date.now() + VOTE_SECONDS * 1000));
      await transitionPhase(sessionId, String(session.currentRound),
        { status: "voting", voteDeadline },
        { status: "voting" },
      );
    } finally {
      advancingRef.current = false;
    }
  }, [session, isHost, round, sessionId, isAsync, activeRoundId]);

  const handleSubmit = async () => {
    if (!answer.trim() || submitting || submitted) return;
    setSubmitting(true);
    try {
      await submitAnswer(sessionId, activeRoundId!, uid, answer.trim());
      setSubmitted(true);

      if (isAsync && room) {
        const newCount = (round?.answerCount ?? 0) + 1;
        if (newCount >= room.memberIds.length) {
          await advanceAsyncRoundToVoting(sessionId, activeRoundId!);
        }
      } else if (isHost && session && room) {
        const newCount = (round?.answerCount ?? 0) + 1;
        if (newCount >= room.memberIds.length) {
          await advanceToVoting();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (!session || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  // Async hub — no round selected
  if (isAsync && !roundParam) {
    return (
      <AsyncGameHub
        roomId={roomId}
        session={session}
        room={room}
        sessionId={sessionId}
      />
    );
  }

  // Waiting for round data
  if (!round) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  const total = room?.memberIds?.length ?? 0;
  const done = round.answerCount ?? 0;
  const roundNumber = isAsync ? Number(activeRoundId) : session.currentRound;

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[14px] flex items-center justify-between">
        <div className="flex-1">
          {isAsync && (
            <button
              onClick={() => router.push(`/rooms/${roomId}/game?sid=${sessionId}`)}
              className="font-gothic text-sub mb-1 flex items-center gap-1"
              style={{ fontSize: 11 }}
            >
              ← お題一覧に戻る
            </button>
          )}
          <p className="font-gothic text-sub" style={{ fontSize: 11 }}>
            {room?.name}・第{roundNumber}問
          </p>
          <p className="font-mincho font-bold text-[#1A1714]" style={{ fontSize: 17 }}>回答を考える</p>
        </div>
        {isAsync ? (
          <AsyncDeadlineBadge deadline={round.answerDeadline} />
        ) : (
          <TimerRing deadline={round.answerDeadline} totalSeconds={room?.answerSeconds ?? 90} onExpire={advanceToVoting} />
        )}
      </div>

      {/* お題カード */}
      {round.question.imageUrl ? (
        <div className="mx-[20px] mb-[18px]">
          <OdaiSheet imageUrl={round.question.imageUrl} text={round.question.text} roundNumber={roundNumber} />
        </div>
      ) : (
        <div
          className="mx-[20px] mb-[18px] relative overflow-hidden"
          style={{ borderRadius: 22, padding: "24px 22px", background: "linear-gradient(140deg,#2BA35F,#1F8A4F)" }}
        >
          <Engimono name="cat" width={96} height={104} style={{ position: "absolute", right: -10, bottom: -14, opacity: 0.9 }} />
          <p className="font-gothic font-extrabold text-[#CFF3DD] mb-2" style={{ fontSize: 12, letterSpacing: "0.1em" }}>
            ＼ 第{roundNumber}問のお題 ／
          </p>
          <p className="font-mincho font-extrabold text-white" style={{ fontSize: 25, lineHeight: 1.5, maxWidth: "80%" }}>
            {round.question.text}
          </p>
        </div>
      )}

      {/* 回答数 */}
      <div className="px-[20px] flex items-center gap-[8px] mb-[14px]">
        <div className="flex" style={{ gap: 3 }}>
          {Array.from({ length: done }).map((_, i) => (
            <div key={`done-${i}`} style={{ width: 10, height: 10, borderRadius: "50%", background: "#2BA35F" }} />
          ))}
          {Array.from({ length: total - done }).map((_, i) => (
            <div key={`pending-${i}`} style={{ width: 10, height: 10, borderRadius: "50%", background: "#F4C422" }} />
          ))}
        </div>
        <span className="font-gothic text-sub" style={{ fontSize: 11 }}>{done} / {total} 人が回答済み</span>
      </div>

      {/* 回答入力エリア */}
      <div className="flex-1 px-[20px] pb-[40px] flex flex-col">
        {submitted ? (
          <div className="space-y-3 animate-rise">
            <div className="bg-white text-center" style={{ borderRadius: 18, padding: 20, border: "2px solid #2BA35F" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2BA35F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                <path d="M5 13l5 5L19 6"/>
              </svg>
              <p className="font-gothic font-bold text-[#2BA35F]" style={{ fontSize: 14 }}>回答を投じました</p>
              <p className="font-gothic text-sub mt-1" style={{ fontSize: 12 }}>
                {isAsync
                  ? "全員の回答が揃うと投票が始まります"
                  : "他の人の回答を待っています…"}
              </p>
            </div>
            {isAsync ? (
              <button
                onClick={() => router.push(`/rooms/${roomId}/game?sid=${sessionId}`)}
                className="w-full font-gothic font-bold text-sub active:scale-[0.98] transition-transform"
                style={{ fontSize: 14, padding: "12px 0", borderRadius: 14, border: "1px solid rgba(0,0,0,.1)" }}
              >
                ← お題一覧に戻る
              </button>
            ) : isHost ? (
              <button
                onClick={advanceToVoting}
                className="w-full font-gothic font-bold text-sub active:scale-[0.98] transition-transform"
                style={{ fontSize: 14, padding: "12px 0", borderRadius: 14, border: "1px solid rgba(0,0,0,.1)" }}
              >
                投票フェーズに進む →
              </button>
            ) : null}
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-3">
            <label className="font-gothic font-extrabold text-sub" style={{ fontSize: 12 }}>あなたの回答</label>
            <textarea
              className="flex-1 bg-white font-gothic font-semibold text-[#1A1714] outline-none resize-none"
              style={{
                borderRadius: 18, padding: "16px", fontSize: 17, lineHeight: 1.6,
                border: "1.5px dashed #E0A93B", minHeight: 120,
              }}
              placeholder="面白い回答を入力…"
              maxLength={40}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex justify-between items-center font-gothic text-sub" style={{ fontSize: 11 }}>
              <span>記名なしで投稿されます</span>
              <span>{answer.length} / 40</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-all"
              style={{ fontSize: 18, padding: "16px 0", borderRadius: 18, background: "#E5402F", boxShadow: "0 14px 26px -10px rgba(229,64,47,0.6)" }}
            >
              {submitting ? "送信中…" : "回答を投じる"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    }>
      <GamePageContent />
    </Suspense>
  );
}
