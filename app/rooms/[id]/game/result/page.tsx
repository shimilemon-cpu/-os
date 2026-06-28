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
const PERSONA_CONFIG: Record<string, { emoji: string; mascot: "j_king" | "j_sharp"; color: string }> = {
  王道: { emoji: "👑", mascot: "j_king", color: "#FFD600" },
  辛口: { emoji: "🔪", mascot: "j_sharp", color: "#FF4D6D" },
};

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
  const prefetchRef = useRef<Promise<QuestionData> | null>(null);

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

  // 結果表示中に次ラウンドのお題を先読みしておく
  useEffect(() => {
    if (!isHost || !session) return;
    if (session.currentRound >= session.totalRounds) return;
    if (prefetchRef.current) return;
    prefetchRef.current = prefetchQuestion();
  }, [isHost, session]);

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
      const data = await (prefetchRef.current ?? prefetchQuestion());
      prefetchRef.current = null;
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
  const reviewsLoaded = aiReviews.length >= answers.length * 3;

  return (
    <div className="min-h-screen flex flex-col px-4 pt-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-zinc-500">ラウンド {roundParam} 結果</p>
          <h1 className="font-display text-pop-yellow text-2xl">結果発表！</h1>
        </div>
        <span className="text-xs text-zinc-600 bg-surface border border-line rounded-full px-3 py-1">
          {roundParam}/{session?.totalRounds}
        </span>
      </div>

      {/* MVP card */}
      {mvp && (
        <div className="relative bg-pop-yellow/10 border-2 border-pop-yellow/60 rounded-3xl p-5 mb-6 animate-pop-in">
          <div className="absolute -top-3 left-4">
            <Mascot kind="crown" size={24} tint="#FFD600" className="animate-crown-bob" />
          </div>
          <p className="text-xs text-pop-yellow font-bold tracking-wide mb-2 mt-1">MVP回答</p>
          <p className="text-white text-base leading-relaxed font-medium">{mvp.text}</p>
          <div className="flex gap-4 mt-3 text-xs text-zinc-500">
            <span>😂 {tally[mvp.id]?.funny ?? 0}</span>
            <span>🧠 {tally[mvp.id]?.smart ?? 0}</span>
            <span>🤯 {tally[mvp.id]?.crazy ?? 0}</span>
            <span className="ml-auto text-pop-yellow font-bold">{tally[mvp.id]?.total ?? 0}票</span>
          </div>
        </div>
      )}

      {/* All answers */}
      <div className="space-y-3 mb-6">
        <p className="text-xs text-zinc-500 tracking-wide">全回答</p>
        {sorted.map((a) => (
          <AnswerCard
            key={a.id}
            answer={a}
            index={answers.indexOf(a)}
            votes={votes}
            myVote={null}
            canVote={false}
            isOwn={a.userId === uid}
            revealed={true}
            onVote={undefined}
          />
        ))}
      </div>

      {/* AI Reviews */}
      <div className="space-y-3 mb-8">
        <p className="text-xs text-zinc-500 tracking-wide">AI審査員の講評</p>
        {!reviewsLoaded && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <div className="w-4 h-4 rounded-full border border-zinc-600 border-t-transparent animate-spin" />
            AI審査員が採点中...
          </div>
        )}
        {["王道", "辛口"].map((persona) => {
          const cfg = PERSONA_CONFIG[persona];
          const personaReviews = aiReviews.filter((r) => r.persona === persona);
          if (personaReviews.length === 0) return null;
          const topReview = personaReviews.sort((a, b) => b.score - a.score)[0];
          const topAnswer = answers.find((a) => a.id === topReview.answerId);
          return (
            <div
              key={persona}
              className="bg-surface border border-line rounded-2xl p-4 space-y-2 animate-flip-in"
            >
              <div className="flex items-center gap-2">
                <Mascot kind={cfg.mascot} size={28} />
                <p className="text-sm font-bold" style={{ color: cfg.color }}>
                  {cfg.emoji} {persona}AI
                </p>
                <span className="ml-auto text-xs font-bold" style={{ color: cfg.color }}>
                  {topReview.score}点
                </span>
              </div>
              <p className="text-zinc-500 text-xs">「{topAnswer?.text ?? ""}」</p>
              <p className="text-white text-sm leading-relaxed">{topReview.comment}</p>
            </div>
          );
        })}
      </div>

      <AdSlot id="result-banner" size="rect" className="mb-6" />

      {isHost && (
        <button
          onClick={goNext}
          className="w-full bg-pop-yellow text-ink font-display py-4 rounded-2xl text-lg active:scale-[0.98] transition-all"
        >
          {session && session.currentRound >= session.totalRounds
            ? "最終結果を見る 🏆"
            : `ラウンド ${(session?.currentRound ?? 0) + 1} へ →`}
        </button>
      )}
      {!isHost && (
        <p className="text-center text-zinc-500 text-sm">ホストの操作を待っています...</p>
      )}
    </div>
  );
}
