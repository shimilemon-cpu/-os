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
      // Follow phase changes
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

  // Host advances to voting when timer expires or all answered
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
      // If all members answered, host advances
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-[var(--muted)] tracking-wide">
            ラウンド {session.currentRound} / {session.totalRounds}
          </p>
          <p className="text-xs text-[var(--accent)]">{round.question.genre} · {round.question.difficulty}</p>
        </div>
        <Timer deadline={round.answerDeadline} onExpire={isHost ? advanceToVoting : undefined} />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        <div className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <p className="text-xs text-[var(--muted)] mb-3">お題</p>
          <p className="text-[var(--text)] text-xl leading-relaxed font-medium text-center">
            {round.question.text}
          </p>
        </div>

        {/* Progress */}
        <p className="text-xs text-[var(--muted)]">
          {round.answerCount}/{room?.memberIds.length ?? "?"}人が回答済み
        </p>
      </div>

      {/* Answer Input */}
      {submitted ? (
        <div className="space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--ok)]/40 rounded-2xl p-4 text-center">
            <p className="text-[var(--ok)] text-sm font-medium">✓ 回答を送信しました</p>
            <p className="text-[var(--muted)] text-xs mt-1">他の人の回答を待っています...</p>
          </div>
          {isHost && (
            <button
              onClick={advanceToVoting}
              className="w-full border border-[var(--accent)]/40 text-[var(--accent)] text-sm py-3 rounded-xl active:scale-[0.98] transition-transform"
            >
              投票フェーズに進む →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--text)] text-base placeholder:text-[var(--placeholder)] outline-none focus:border-[var(--accent)]/60 resize-none transition-colors"
            placeholder="面白い回答を入力..."
            rows={3}
            maxLength={200}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || submitting}
            className="w-full bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-2xl text-base disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {submitting ? "送信中..." : "回答する"}
          </button>
        </div>
      )}
    </div>
  );
}
