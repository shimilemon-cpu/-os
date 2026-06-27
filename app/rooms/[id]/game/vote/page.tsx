"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import {
  subscribeAnswers, subscribeVotes, subscribeSession,
  subscribeRound, submitVote, updateRound, updateSession,
} from "@/lib/ogiri/sessions";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import type { SessionDoc, RoundDoc, AnswerDoc, VoteDoc, RoomDoc, Reaction } from "@/lib/types";
import AnswerCard from "@/components/ogiri/AnswerCard";
import Timer from "@/components/ogiri/Timer";

const VOTE_SECONDS = 45;

export default function VotePage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") ?? "";
  const roundParam = searchParams.get("round") ?? "1";
  const router = useRouter();

  const [session, setSession] = useState<SessionDoc | null>(null);
  const [round, setRound] = useState<RoundDoc | null>(null);
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [answers, setAnswers] = useState<AnswerDoc[]>([]);
  const [votes, setVotes] = useState<VoteDoc[]>([]);
  const uid = auth.currentUser?.uid ?? "";
  const isHost = room?.hostId === uid;
  const advancingRef = useRef(false);

  useEffect(() => {
    const u1 = subscribeRoom(roomId, setRoom);
    const u2 = subscribeSession(sessionId, (s) => {
      setSession(s);
      if (s.status === "reviewing") {
        router.replace(`/rooms/${roomId}/game/result?sid=${sessionId}&round=${roundParam}`);
      }
      if (s.status === "finished") {
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
      }
    });
    const u3 = subscribeRound(sessionId, roundParam, setRound);
    const u4 = subscribeAnswers(sessionId, roundParam, setAnswers);
    const u5 = subscribeVotes(sessionId, roundParam, setVotes);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [roomId, sessionId, roundParam, router]);

  const voteDeadline = (() => {
    const raw = round?.voteDeadline;
    if (!raw) return null;
    if (typeof (raw as { toDate?: unknown }).toDate === "function") return raw;
    return null;
  })();

  const advanceToResult = useCallback(async () => {
    if (!session || !isHost || advancingRef.current) return;
    if (round?.status !== "voting") return;
    advancingRef.current = true;
    try {
      await updateRound(sessionId, roundParam, { status: "reviewing" });
      await updateSession(sessionId, { status: "reviewing" });
      // Trigger AI reviews
      const answerPayload = answers.map((a) => ({ id: a.id, text: a.text }));
      fetch("/api/ogiri/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          roundId: roundParam,
          question: round?.question.text ?? "",
          answers: answerPayload,
        }),
      }).catch(console.error);
    } finally {
      advancingRef.current = false;
    }
  }, [session, isHost, round, sessionId, roundParam, answers]);

  const handleVote = async (answerId: string, reaction: Reaction) => {
    const alreadyVoted = votes.some((v) => v.answerId === answerId && v.voterId === uid);
    if (alreadyVoted) return;
    await submitVote(sessionId, roundParam, answerId, uid, reaction);

    // If all members voted on all answers (or close), host can advance
    if (isHost && session && room) {
      const totalExpected = (room.memberIds.length - 1) * answers.length;
      const myVotes = votes.filter((v) => v.voterId === uid).length + 1;
      if (myVotes >= answers.length - 1 && votes.length + 1 >= totalExpected) {
        await advanceToResult();
      }
    }
  };

  const myVotesMap: Record<string, Reaction> = {};
  for (const v of votes) {
    if (v.voterId === uid) myVotesMap[v.answerId] = v.reaction;
  }

  if (!session || !round || answers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 pt-12 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-[var(--muted)]">ラウンド {roundParam} / {session.totalRounds}</p>
          <p className="text-sm text-[var(--text)] font-medium mt-0.5">投票タイム 😂🧠🤯</p>
        </div>
        <Timer deadline={voteDeadline} onExpire={isHost ? advanceToResult : undefined} />
      </div>

      {/* Question */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 mb-5">
        <p className="text-[var(--muted)] text-xs mb-1">お題</p>
        <p className="text-[var(--text)] text-sm leading-relaxed">{round.question.text}</p>
      </div>

      {/* Answers */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {answers.map((a, i) => (
          <AnswerCard
            key={a.id}
            answer={a}
            index={i}
            votes={votes}
            myVote={myVotesMap[a.id] ?? null}
            canVote={true}
            isOwn={a.userId === uid}
            onVote={handleVote}
          />
        ))}
      </div>

      {isHost && (
        <button
          onClick={advanceToResult}
          className="mt-4 w-full border border-[var(--accent)]/40 text-[var(--accent)] text-sm py-3 rounded-xl active:scale-[0.98] transition-transform"
        >
          結果を見る →
        </button>
      )}
    </div>
  );
}
