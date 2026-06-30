"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import {
  subscribeSession, subscribeRound, submitAnswer,
  updateRound, updateSession, createRound,
} from "@/lib/ogiri/sessions";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import type { SessionDoc, RoundDoc, RoomDoc } from "@/lib/types";
import Timer from "@/components/ogiri/Timer";

const ANSWER_SECONDS = 90;
const VOTE_SECONDS = 45;

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
    if (!session || !isHost || advancingRef.current) return;
    if (round?.status !== "answering") return;
    advancingRef.current = true;
    try {
      const voteDeadline = new Date(Date.now() + VOTE_SECONDS * 1000);
      await updateRound(sessionId, String(session.currentRound), {
        status: "voting",
        // @ts-expect-error - dynamic field
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
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="w-8 h-8 rounded-full border-2 border-pop-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-8 bg-ink">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex-1">
          <p className="text-text-muted text-[11px]">{room?.name}・第{session.currentRound}問</p>
          <p className="font-display text-text text-lg font-bold">回答を考える</p>
        </div>
        <Timer deadline={round.answerDeadline} totalSeconds={ANSWER_SECONDS} onExpire={isHost ? advanceToVoting : undefined} />
      </div>

      {/* お題カード */}
      <div
        className="rounded-[22px] p-6 mb-5 relative overflow-hidden flex-none animate-pop-in"
        style={{ background: "linear-gradient(140deg,#2BA35F,#1F8A4F)" }}
      >
        <svg className="absolute right-[-10px] bottom-[-14px] w-24 opacity-90">
          <use href="#c-cat" width="100%" height="100%"/>
        </svg>
        <p className="text-[12px] font-black tracking-wide mb-2" style={{ color: "#CFF3DD" }}>
          ＼ 第{session.currentRound}問のお題 ／
        </p>
        <p className="font-display font-bold text-[22px] leading-[1.5] text-white max-w-[80%]">
          {round.question.text}
        </p>
      </div>

      {/* 回答数ドット */}
      {(() => {
        const total = room?.memberIds.length ?? 0;
        const done = round.answerCount ?? 0;
        const dotColors = ["#E5402F", "#2BA35F", "#F4C422", "#F0922B", "#7A6F5C"];
        return (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1.5">
              {Array.from({ length: total }).map((_, i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ background: i < done ? dotColors[i % dotColors.length] : "#E4DCCF" }}
                />
              ))}
            </div>
            <p className="text-text-muted text-xs">{done}/{total}人が回答済み</p>
          </div>
        );
      })()}

      {/* 回答入力 */}
      <div className="flex-1 flex flex-col">
        {submitted ? (
          <div className="space-y-3 animate-rise">
            <div className="bg-surface rounded-2xl p-5 text-center" style={{ border: "2px solid #2BA35F" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2BA35F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                <path d="M5 13l5 5L19 6"/>
              </svg>
              <p className="font-bold text-sm" style={{ color: "#2BA35F" }}>回答を投じました</p>
              <p className="text-text-muted text-xs mt-1">他の人の回答を待っています…</p>
            </div>
            {isHost && (
              <button
                onClick={advanceToVoting}
                className="w-full text-sm py-3 rounded-xl active:scale-[0.98] transition-transform font-bold text-text-sub"
                style={{ border: "1px solid rgba(0,0,0,.1)" }}
              >
                投票フェーズに進む →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 flex-1 flex flex-col">
            <p className="text-xs font-black text-text-muted">あなたの回答</p>
            <textarea
              className="flex-1 bg-surface rounded-[18px] px-4 py-4 text-text text-[17px] font-semibold leading-relaxed placeholder:text-text-faint outline-none resize-none transition-colors"
              style={{ border: "1.5px solid #E0A93B", minHeight: "120px" }}
              placeholder="面白い回答を入力…"
              maxLength={40}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="flex justify-between items-center text-xs text-text-muted">
              <span>記名なしで投稿されます</span>
              <span>{answer.length} / 40</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!answer.trim() || submitting}
              className="w-full font-display font-bold py-4 rounded-2xl text-lg disabled:opacity-40 active:scale-[0.98] transition-all text-[#FBF7EC]"
              style={{ background: "#E5402F" }}
            >
              {submitting ? "送信中…" : "回答を投じる"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
