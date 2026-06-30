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
import AdSlot from "@/components/AdSlot";
import InterstitialAd from "@/components/InterstitialAd";

type QuestionData = { question: string; genre: string; difficulty: string };

function prefetchQuestion(): Promise<QuestionData> {
  return fetch("/api/ogiri/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).then((r) => r.json() as Promise<QuestionData>);
}

const ANSWER_SECONDS = 90;
const RANK_LABELS = ["横綱", "大関", "関脇", "前頭"];
const RANK_COLORS = ["#E5402F", "#2BA35F", "#E0A93B", "#7A6F5C"];

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
  const [showInterstitial, setShowInterstitial] = useState(false);
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

  useEffect(() => {
    if (!isHost || !session) return;
    if (session.currentRound >= session.totalRounds) return;
    if (prefetchRef.current) return;
    prefetchRef.current = prefetchQuestion();
  }, [isHost, session]);

  const doFinish = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      await updateSession(sessionId, { status: "finished" });
      await finishGame(roomId);
    } finally {
      advancingRef.current = false;
    }
  }, [sessionId, roomId]);

  const goNext = useCallback(async () => {
    if (!session || !isHost || advancingRef.current) return;
    const nextRound = session.currentRound + 1;
    if (nextRound > session.totalRounds) {
      setShowInterstitial(true);
      return;
    }
    advancingRef.current = true;
    try {
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
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-10 bg-ink">
      {showInterstitial && (
        <InterstitialAd
          onClose={() => { setShowInterstitial(false); doFinish(); }}
          skipAfter={5}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-text-muted text-[11px]">ラウンド {roundParam} 結果</p>
          <h1 className="font-display text-text text-2xl font-bold">大入満員御礼</h1>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: "#E6F5EC", color: "#2BA35F" }}
        >
          大入満員御礼
        </span>
      </div>

      {/* 横綱カード */}
      {mvp && (
        <div
          className="relative rounded-[24px] px-5 py-6 mb-5 text-center overflow-hidden animate-pop-in text-[#FBF7EC]"
          style={{ background: "linear-gradient(150deg,#E5402F,#F0922B)" }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 0%,rgba(255,255,255,.25),transparent 50%)" }}/>
          <div className="relative">
            <p className="font-display font-bold text-[15px] tracking-[0.3em] mb-1" style={{ color: "#FFE9B0" }}>横　綱</p>
            <svg className="w-20 h-22 mx-auto my-2 block">
              <use href="#c-daruma" width="100%" height="100%"/>
            </svg>
            <p className="font-display font-bold text-xl leading-snug mt-2">{mvp.text}</p>
            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full font-bold text-sm" style={{ background: "rgba(0,0,0,.22)" }}>
              <svg width="16" height="14" viewBox="0 0 30 24"><path d="M5 6h20l3 6-3 6H5L2 12z" fill="#F4C422"/></svg>
              座布団 {tally[mvp.id]?.total ?? 0}枚
            </div>
          </div>
        </div>
      )}

      {/* 番付リスト */}
      <div className="space-y-2.5 mb-5">
        {sorted.slice(1).map((a, i) => {
          const rank = i + 1;
          const label = RANK_LABELS[rank] ?? "前頭";
          const color = RANK_COLORS[rank] ?? RANK_COLORS[3];
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 bg-surface rounded-[15px] px-4 py-3"
              style={{ border: "1px solid rgba(0,0,0,.07)" }}
            >
              <span className="font-display font-bold text-sm w-9 flex-none" style={{ color }}>{label}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-text">{a.text}</p>
              </div>
              <span className="font-bold text-sm flex-none" style={{ color: "#E5402F" }}>
                {tally[a.id]?.total ?? 0}枚
              </span>
            </div>
          );
        })}
      </div>

      {/* AI講評 */}
      <div className="space-y-3 mb-6">
        <p className="text-xs font-bold text-text-muted">AI審査員の講評</p>
        {!reviewsLoaded && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div className="w-4 h-4 rounded-full border border-line border-t-transparent animate-spin" style={{ borderTopColor: "#E5402F" }} />
            AI審査員が採点中…
          </div>
        )}
        {["王道", "辛口"].map((persona) => {
          const personaReviews = aiReviews.filter((r) => r.persona === persona);
          if (personaReviews.length === 0) return null;
          const topReview = personaReviews.sort((a, b) => b.score - a.score)[0];
          const topAnswer = answers.find((a) => a.id === topReview.answerId);
          const color = persona === "王道" ? "#F4C422" : "#E5402F";
          return (
            <div
              key={persona}
              className="bg-surface rounded-2xl p-4 space-y-2 animate-flip-in"
              style={{ border: "1px solid rgba(0,0,0,.07)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold" style={{ color }}>
                  {persona === "王道" ? "👑" : "🔪"} {persona}AI
                </p>
                <span className="text-sm font-bold" style={{ color }}>{topReview.score}点</span>
              </div>
              <p className="text-text-muted text-xs">「{topAnswer?.text ?? ""}」</p>
              <p className="text-text text-sm leading-relaxed">{topReview.comment}</p>
            </div>
          );
        })}
      </div>

      <AdSlot id="result-banner" size="rect" className="mb-6" />

      <div className="flex gap-3">
        {isHost && (
          <>
            <button
              className="w-14 h-14 flex-none bg-surface grid place-items-center rounded-[17px] active:scale-95 transition-transform"
              style={{ border: "1px solid rgba(0,0,0,.1)" }}
              onClick={() => {}}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2"><path d="M4 12a8 8 0 1 1 2.3 5.6" strokeLinecap="round"/><path d="M4 20v-5h5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={goNext}
              className="flex-1 font-display font-bold py-4 rounded-[17px] text-lg active:scale-[0.98] transition-all text-[#FBF7EC]"
              style={{ background: "#2BA35F", boxShadow: "0 14px 26px -10px rgba(43,163,95,.6)" }}
            >
              {session && session.currentRound >= session.totalRounds ? "最終結果を見る" : "次のお題へ"}
            </button>
          </>
        )}
        {!isHost && (
          <p className="w-full text-center text-text-muted text-sm py-4">ホストの操作を待っています…</p>
        )}
      </div>
    </div>
  );
}
