"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import {
  subscribeSession, subscribeRound, subscribeAnswers,
  subscribeVotes, subscribeAiReviews, tallyVotes,
  updateRound, updateSession, createRound,
} from "@/lib/ogiri/sessions";
import { subscribeRoom, finishGame } from "@/lib/ogiri/rooms";
import type { SessionDoc, RoundDoc, AnswerDoc, VoteDoc, AiReviewDoc, RoomDoc } from "@/lib/types";
import AnswerCard from "@/components/ogiri/AnswerCard";

const ANSWER_SECONDS = 90;
const PERSONA_EMOJI: Record<string, string> = { 王道: "👑", 辛口: "🔪", カオス: "🌀" };

export default function ResultPage() {
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
  const [aiReviews, setAiReviews] = useState<AiReviewDoc[]>([]);
  const uid = auth.currentUser?.uid ?? "";
  const isHost = room?.hostId === uid;
  const advancingRef = useRef(false);

  useEffect(() => {
    const u1 = subscribeRoom(roomId, setRoom);
    const u2 = subscribeSession(sessionId, (s) => {
      setSession(s);
      if (s.status === "answering") {
        router.replace(`/rooms/${roomId}/game?sid=${sessionId}`);
      }
      if (s.status === "finished") {
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
      }
    });
    const u3 = subscribeRound(sessionId, roundParam, setRound);
    const u4 = subscribeAnswers(sessionId, roundParam, setAnswers);
    const u5 = subscribeVotes(sessionId, roundParam, setVotes);
    const u6 = subscribeAiReviews(sessionId, roundParam, setAiReviews);
    return () => { u1(); u2(); u3(); u4(); u5(); u6(); };
  }, [roomId, sessionId, roundParam, router]);

  const goNext = useCallback(async () => {
    if (!session || !isHost || advancingRef.current) return;
    advancingRef.current = true;
    try {
      const nextRound = session.currentRound + 1;
      if (nextRound > session.totalRounds) {
        await updateSession(sessionId, { status: "finished" });
        await finishGame(roomId);
        return;
      }
      // Generate next question
      const res = await fetch("/api/ogiri/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json() as { question: string; genre: string; difficulty: string };
      await createRound(sessionId, nextRound, {
        text: data.question,
        genre: data.genre as never,
        difficulty: data.difficulty as never,
      }, ANSWER_SECONDS);
      await updateRound(sessionId, roundParam, { status: "done" });
      await updateSession(sessionId, {
        currentRound: nextRound,
        status: "answering",
      });
    } finally {
      advancingRef.current = false;
    }
  }, [session, isHost, sessionId, roundParam, roomId]);

  const tally = tallyVotes(votes);
  const sorted = [...answers].sort(
    (a, b) => (tally[b.id]?.total ?? 0) - (tally[a.id]?.total ?? 0)
  );
  const mvp = sorted[0];

  // Nickname map (revealed after round)
  const nickMap: Record<string, string> = {};
  if (room) {
    // We don't have member nicknames here — show displayOrder label
  }

  const reviewsLoaded = aiReviews.length >= answers.length * 3;

  return (
    <div className="min-h-screen flex flex-col px-4 pt-12 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-[var(--muted)]">ラウンド {roundParam} 結果</p>
          <h1 className="text-[var(--accent)] text-xl font-bold">結果発表 🎉</h1>
        </div>
        <span className="text-xs text-[var(--muted)]">
          {roundParam}/{session?.totalRounds}
        </span>
      </div>

      {/* MVP */}
      {mvp && (
        <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/40 rounded-2xl p-5 mb-6 space-y-2">
          <p className="text-xs text-[var(--accent)] tracking-wide font-bold">👑 MVP回答</p>
          <p className="text-[var(--text)] text-base leading-relaxed">{mvp.text}</p>
          <div className="flex gap-3 text-xs text-[var(--muted)]">
            <span>😂 {tally[mvp.id]?.funny ?? 0}</span>
            <span>🧠 {tally[mvp.id]?.smart ?? 0}</span>
            <span>🤯 {tally[mvp.id]?.crazy ?? 0}</span>
          </div>
        </div>
      )}

      {/* All answers with votes */}
      <div className="space-y-3 mb-6">
        <p className="text-xs text-[var(--muted)] tracking-wide">全回答</p>
        {sorted.map((a, i) => (
          <AnswerCard
            key={a.id}
            answer={a}
            index={answers.indexOf(a)}
            votes={votes}
            myVote={null}
            canVote={false}
            isOwn={a.userId === uid}
            revealed={true}
            authorNickname={nickMap[a.userId]}
            onVote={undefined}
          />
        ))}
      </div>

      {/* AI Reviews */}
      <div className="space-y-3 mb-8">
        <p className="text-xs text-[var(--muted)] tracking-wide">AI審査員の講評</p>
        {!reviewsLoaded && (
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <div className="w-4 h-4 rounded-full border border-[var(--muted)] border-t-transparent animate-spin" />
            AI審査員が採点中...
          </div>
        )}
        {["王道", "辛口", "カオス"].map((persona) => {
          const personaReviews = aiReviews.filter((r) => r.persona === persona);
          if (personaReviews.length === 0) return null;
          const topReview = personaReviews.sort((a, b) => b.score - a.score)[0];
          const topAnswer = answers.find((a) => a.id === topReview.answerId);
          return (
            <div key={persona} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[var(--accent)]">
                  {PERSONA_EMOJI[persona]} {persona}AI
                </p>
                <span className="text-xs text-[var(--muted)]">
                  最高 {topReview.score}点
                </span>
              </div>
              <p className="text-[var(--muted)] text-xs">「{topAnswer?.text ?? ""}」</p>
              <p className="text-[var(--text)] text-sm leading-relaxed">{topReview.comment}</p>
            </div>
          );
        })}
      </div>

      {isHost && (
        <button
          onClick={goNext}
          className="w-full bg-[var(--accent)] text-[var(--bg)] font-bold py-4 rounded-2xl text-base active:scale-[0.98] transition-all"
        >
          {session && session.currentRound >= session.totalRounds
            ? "最終結果を見る 🏆"
            : `ラウンド ${(session?.currentRound ?? 0) + 1} へ →`}
        </button>
      )}
      {!isHost && (
        <p className="text-center text-[var(--muted)] text-sm">ホストの操作を待っています...</p>
      )}
    </div>
  );
}
