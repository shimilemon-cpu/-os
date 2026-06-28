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
import Mascot from "@/components/Mascot";

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
        <div className="w-8 h-8 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 pt-8 pb-8">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="bg-surface border border-line rounded-full px-3 py-1.5">
          <p className="text-xs text-zinc-400">
            Round <span className="text-pop-yellow font-bold">{session.currentRound}</span>/{session.totalRounds}
          </p>
        </div>
        <Timer deadline={round.answerDeadline} totalSeconds={ANSWER_SECONDS} onExpire={isHost ? advanceToVoting : undefined} />
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-4">
        <div className="w-full relative animate-pop-in">
          {/* Speech bubble style */}
          <div className="bg-surface-2 border-2 border-pop-yellow/30 rounded-3xl p-6 relative">
            <div className="flex items-center gap-2 mb-3">
              <Mascot kind="mic" size={16} tint="#FFD600" />
              <span className="text-xs text-pop-yellow font-bold tracking-wide">お題</span>
              <span className="text-xs text-zinc-600 ml-auto">{round.question.genre}</span>
            </div>
            <p className="text-white text-xl leading-relaxed font-medium text-center">
              {round.question.text}
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          {round.answerCount}/{room?.memberIds.length ?? "?"}人が回答済み
        </p>
      </div>

      {/* Answer input */}
      {submitted ? (
        <div className="space-y-3 animate-rise">
          <div className="bg-pop-green/10 border border-pop-green/40 rounded-2xl p-4 text-center">
            <Mascot kind="check" size={24} tint="#3DDC84" className="mx-auto mb-2" />
            <p className="text-pop-green text-sm font-bold">回答を送信しました</p>
            <p className="text-zinc-500 text-xs mt-1">他の人の回答を待っています...</p>
          </div>
          {isHost && (
            <button
              onClick={advanceToVoting}
              className="w-full border border-pop-yellow/40 text-pop-yellow text-sm py-3 rounded-xl active:scale-[0.98] transition-transform"
            >
              投票フェーズに進む →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            className="w-full bg-surface border border-line rounded-2xl px-4 py-3 text-white text-base placeholder:text-zinc-600 outline-none focus:border-pop-yellow/60 resize-none transition-colors"
            placeholder="面白い回答を入力..."
            rows={3}
            maxLength={200}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || submitting}
            className="w-full bg-pop-yellow text-ink font-display py-4 rounded-2xl text-lg disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {submitting ? "送信中..." : "回答する！"}
          </button>
        </div>
      )}
    </div>
  );
}
