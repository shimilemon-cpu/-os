"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import {
  subscribeSession, subscribeRound, submitAnswer,
  updateRound, updateSession,
} from "@/lib/ogiri/sessions";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import type { SessionDoc, RoundDoc, RoomDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import OdaiSheet from "@/components/OdaiSheet";

const ANSWER_SECONDS = 90;
const VOTE_SECONDS = 45;

function TimerRing({ deadline, totalSeconds, onExpire }: { deadline: RoundDoc["answerDeadline"] | null; totalSeconds: number; onExpire?: () => void }) {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const toDate = (deadline as { toDate?: () => Date }).toDate;
    const end = typeof toDate === "function" ? toDate().getTime() : 0;
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
          stroke="#E5402F"
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

export default function GamePage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") ?? "";
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

  useEffect(() => {
    const u1 = subscribeRoom(roomId, setRoom);
    const u2 = subscribeSession(sessionId, (s) => {
      setSession(s);
      if (s.status === "voting") {
        router.replace(`/rooms/${roomId}/game/vote?sid=${sessionId}&round=${s.currentRound}`);
      }
      if (s.status === "finished") {
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
      }
    });
    return () => { u1(); u2(); };
  }, [roomId, sessionId, router]);

  useEffect(() => {
    if (!session) return;
    const u = subscribeRound(sessionId, String(session.currentRound), setRound);
    setSubmitted(false);
    setAnswer("");
    return u;
  }, [sessionId, session?.currentRound]);

  const advanceToVoting = useCallback(async () => {
    if (!session || advancingRef.current) return;
    if (round?.status !== "answering") return;
    // In async mode any player can trigger deadline-based transitions; host can always advance manually
    const isDeadlinePast = (() => {
      const dl = round.answerDeadline;
      if (!dl) return false;
      const toDate = (dl as { toDate?: () => Date }).toDate;
      const end = typeof toDate === "function" ? toDate().getTime() : 0;
      return end > 0 && Date.now() >= end;
    })();
    if (!isHost && !isDeadlinePast) return;
    advancingRef.current = true;
    try {
      const voteDeadline = new Date(Date.now() + VOTE_SECONDS * 1000);
      await updateRound(sessionId, String(session.currentRound), {
        status: "voting",
        // @ts-expect-error dynamic field
        voteDeadline: { seconds: Math.floor(voteDeadline.getTime() / 1000), nanoseconds: 0 },
      });
      await updateSession(sessionId, { status: "voting" });
    } finally {
      advancingRef.current = false;
    }
  }, [session, isHost, round, sessionId]);

  const handleSubmit = async () => {
    if (!answer.trim() || submitting || submitted) return;
    setSubmitting(true);
    try {
      await submitAnswer(sessionId, String(session!.currentRound), uid, answer.trim());
      setSubmitted(true);
      if (isHost && session && room) {
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

  if (!session || !round) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  const total = room?.memberIds.length ?? 0;
  const done = round.answerCount ?? 0;
  const AVATAR_COLORS = ["#E5402F", "#2BA35F", "#F4C422", "#F0552E", "#5BA9D6"];

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[14px] flex items-center justify-between">
        <div className="flex-1">
          <p className="font-gothic text-sub" style={{ fontSize: 11 }}>{room?.name}・第{session.currentRound}問</p>
          <p className="font-mincho font-bold text-[#1A1714]" style={{ fontSize: 17 }}>回答を考える</p>
        </div>
        <TimerRing deadline={round.answerDeadline} totalSeconds={ANSWER_SECONDS} onExpire={advanceToVoting} />
      </div>

      {/* お題カード */}
      {round.question.imageUrl ? (
        <div className="mx-[20px] mb-[18px]">
          <OdaiSheet imageUrl={round.question.imageUrl} text={round.question.text} roundNumber={session.currentRound} />
        </div>
      ) : (
        <div
          className="mx-[20px] mb-[18px] relative overflow-hidden"
          style={{ borderRadius: 22, padding: "24px 22px", background: "linear-gradient(140deg,#2BA35F,#1F8A4F)" }}
        >
          <Engimono name="cat" width={96} height={104} style={{ position: "absolute", right: -10, bottom: -14, opacity: 0.9 }} />
          <p className="font-gothic font-extrabold text-[#CFF3DD] mb-2" style={{ fontSize: 12, letterSpacing: "0.1em" }}>
            ＼ 第{session.currentRound}問のお題 ／
          </p>
          <p className="font-mincho font-extrabold text-white" style={{ fontSize: 25, lineHeight: 1.5, maxWidth: "80%" }}>
            {round.question.text}
          </p>
        </div>
      )}

      {/* 回答数 */}
      <div className="px-[20px] flex items-center gap-[10px] mb-[14px]">
        <div className="flex" style={{ gap: 0 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: i < done ? AVATAR_COLORS[i % AVATAR_COLORS.length] : "#E4DCCF",
                border: "2px solid #FBF7EC",
                marginLeft: i > 0 ? -6 : 0,
              }}
            />
          ))}
        </div>
        <p className="font-gothic text-sub" style={{ fontSize: 12 }}>{done} / {total} 人が回答済み</p>
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
              <p className="font-gothic text-sub mt-1" style={{ fontSize: 12 }}>他の人の回答を待っています…</p>
            </div>
            {isHost && (
              <button
                onClick={advanceToVoting}
                className="w-full font-gothic font-bold text-sub active:scale-[0.98] transition-transform"
                style={{ fontSize: 14, padding: "12px 0", borderRadius: 14, border: "1px solid rgba(0,0,0,.1)" }}
              >
                投票フェーズに進む →
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-3">
            <label className="font-gothic font-extrabold text-sub" style={{ fontSize: 12 }}>あなたの回答</label>
            <textarea
              className="flex-1 bg-white font-gothic font-semibold text-[#1A1714] outline-none resize-none"
              style={{
                borderRadius: 18, padding: "16px", fontSize: 17, lineHeight: 1.6,
                border: "1.5px solid #E0A93B", minHeight: 120,
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
