"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import {
  subscribeSession, subscribeRound, subscribeAnswers,
  subscribeVotes, subscribeAiReviews, subscribeStamps, toggleStamp, tallyVotes,
  transitionPhase, createRound, updateSession, updateRound,
  subscribeGuesses, tallyGuesses,
} from "@/lib/ogiri/sessions";
import { generateAiAnswers } from "@/lib/ogiri/aiAnswers";
import { subscribeRoom, subscribeMembers, finishGame } from "@/lib/ogiri/rooms";
import { publishToEngawa } from "@/lib/ogiri/engawa";
import type { SessionDoc, RoundDoc, AnswerDoc, VoteDoc, AiReviewDoc, StampDoc, StampType, RoomDoc, RoomMemberDoc, GuessDoc, Genre, Difficulty } from "@/lib/types";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";
import OdaiSheet from "@/components/OdaiSheet";
import InterstitialAd from "@/components/InterstitialAd";
import { validatePhoto, uploadRoomPhoto } from "@/lib/ogiri/photos";

type QuestionData = { question: string; genre: string; difficulty: string };

async function prefetchQuestion(): Promise<QuestionData> {
  const token = await auth.currentUser?.getIdToken();
  return fetch("/api/ogiri/question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
  }).then((r) => r.json() as Promise<QuestionData>);
}

const RANK_LABELS = ["大関", "関脇", "前頭"];
const RANK_COLORS = ["#2BA35F", "#E0A93B", "#7A6F5C"];
const AVATAR_COLORS = ["#2BA35F", "#F4C422", "#D63384", "#E5402F", "#5BA9D6"];

const STAMP_CONFIG: { type: StampType; emoji: string }[] = [
  { type: "秀逸",         emoji: "✨" },
  { type: "天才",         emoji: "🧠" },
  { type: "ツボ",         emoji: "🤣" },
  { type: "思いつかなかった", emoji: "💡" },
  { type: "めっちゃ好き",   emoji: "❤️" },
];

function StampBar({
  answerId, stamps, uid, sessionId, roundId,
}: {
  answerId: string; stamps: StampDoc[]; uid: string; sessionId: string; roundId: string;
}) {
  const answerStamps = stamps.filter((s) => s.answerId === answerId);
  const [busy, setBusy] = useState<string | null>(null);

  const handleToggle = async (stamp: StampType) => {
    if (busy) return;
    setBusy(stamp);
    try {
      await toggleStamp(sessionId, roundId, answerId, uid, stamp);
    } catch (e) {
      console.error("Stamp toggle failed:", e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-[5px] mt-[8px]">
      {STAMP_CONFIG.map(({ type, emoji }) => {
        const count = answerStamps.filter((s) => s.stamp === type).length;
        const mine = answerStamps.some((s) => s.stamp === type && s.userId === uid);
        return (
          <button
            key={type}
            onClick={(e) => { e.stopPropagation(); handleToggle(type); }}
            disabled={busy === type}
            className="flex items-center gap-[3px] font-gothic active:scale-95 transition-all"
            style={{
              fontSize: 11,
              padding: "4px 8px",
              borderRadius: 999,
              background: mine ? "#EBE2CF" : "#F5F2EB",
              border: mine ? "1.5px solid #E0A93B" : "1px solid rgba(0,0,0,.06)",
              fontWeight: mine ? 700 : 500,
              color: mine ? "#9A6410" : "#7A6F5C",
              opacity: busy === type ? 0.5 : 1,
            }}
          >
            <span style={{ fontSize: 13 }}>{emoji}</span>
            <span>{type}</span>
            {count > 0 && <span className="font-extrabold" style={{ color: mine ? "#E0A93B" : "#B6AC97" }}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function ResultPageContent() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") ?? "";
  const roundParam = searchParams.get("round") ?? "1";
  const router = useRouter();

  const [session, setSession] = useState<SessionDoc | null>(null);
  const [round, setRound] = useState<RoundDoc | null>(null);
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [members, setMembers] = useState<RoomMemberDoc[]>([]);
  const [answers, setAnswers] = useState<AnswerDoc[]>([]);
  const [votes, setVotes] = useState<VoteDoc[]>([]);
  const [guesses, setGuesses] = useState<GuessDoc[]>([]);
  const [aiReviews, setAiReviews] = useState<AiReviewDoc[]>([]);
  const [stamps, setStamps] = useState<StampDoc[]>([]);
  const uid = auth.currentUser?.uid ?? "";
  const isHost = room?.hostId === uid;
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [nextPhotoFile, setNextPhotoFile] = useState<File | null>(null);
  const [nextPhotoPreview, setNextPhotoPreview] = useState<string | null>(null);
  const [nextPhotoCaption, setNextPhotoCaption] = useState("");
  const [nextPhotoError, setNextPhotoError] = useState("");
  const [uploadingNext, setUploadingNext] = useState(false);
  const nextFileInputRef = useRef<HTMLInputElement>(null);
  const advancingRef = useRef(false);
  const prefetchRef = useRef<Promise<QuestionData> | null>(null);
  const publishedRef = useRef(false);

  useEffect(() => {
    const u1 = subscribeRoom(roomId, setRoom);
    const u1b = subscribeMembers(roomId, setMembers);
    const u2 = subscribeSession(sessionId, (s) => {
      setSession(s);
      if (s.mode !== "async") {
        if (s.status === "answering") {
          router.replace(`/rooms/${roomId}/game?sid=${sessionId}`);
        }
      }
      if (s.status === "finished") {
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
      }
    });
    const u3 = subscribeRound(sessionId, roundParam, setRound);
    const u4 = subscribeAnswers(sessionId, roundParam, setAnswers);
    const u5 = subscribeVotes(sessionId, roundParam, setVotes);
    const u6 = subscribeAiReviews(sessionId, roundParam, setAiReviews);
    const u7 = subscribeStamps(sessionId, roundParam, setStamps);
    const u8 = subscribeGuesses(sessionId, roundParam, setGuesses);
    return () => { u1(); u1b(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); };
  }, [roomId, sessionId, roundParam, router]);

  useEffect(() => {
    if (!isHost || !session || room?.topicMode === "mochiyori") return;
    if (session.currentRound >= session.totalRounds) return;
    if (prefetchRef.current) return;
    prefetchRef.current = prefetchQuestion();
  }, [isHost, session, room?.topicMode]);

  // Auto-publish to engawa once — skip photo rounds (room-only)
  useEffect(() => {
    if (!round || !session || publishedRef.current) return;
    if (round.question.imageUrl) return;
    publishedRef.current = true;
    publishToEngawa(sessionId, roundParam, round.question).catch(console.error);
  }, [round, session, sessionId, roundParam]);

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

  const handleNextPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validatePhoto(file);
    if (err) { setNextPhotoError(err); return; }
    setNextPhotoError("");
    setNextPhotoFile(file);
    setNextPhotoPreview(URL.createObjectURL(file));
  };

  const goNext = useCallback(async () => {
    if (!session || !room || !isHost || advancingRef.current) return;
    const nextRound = session.currentRound + 1;
    if (nextRound > session.totalRounds) {
      setShowInterstitial(true);
      return;
    }
    const gameMode = room.gameMode ?? "classic";

    if (gameMode === "ai_hunt" || gameMode === "human_hunt") {
      advancingRef.current = true;
      try {
        const data = await (prefetchRef.current ?? prefetchQuestion());
        prefetchRef.current = null;
        const extra = gameMode === "human_hunt"
          ? { answererId: (session.answererOrder ?? room.memberIds)[(nextRound - 1) % (session.answererOrder ?? room.memberIds).length] }
          : undefined;
        await createRound(sessionId, nextRound, {
          text: data.question,
          genre: data.genre as Genre,
          difficulty: data.difficulty as Difficulty,
        }, room.answerSeconds ?? 90, extra);
        await generateAiAnswers(sessionId, String(nextRound), data.question, gameMode === "ai_hunt" ? 1 : 3);
        await transitionPhase(sessionId, roundParam,
          { status: "done" },
          { currentRound: nextRound, status: "answering" },
        );
      } finally {
        advancingRef.current = false;
      }
      return;
    }

    const isMochiyori = room?.topicMode === "mochiyori";
    if (isMochiyori && !nextPhotoFile) {
      setShowPhotoUpload(true);
      return;
    }
    advancingRef.current = true;
    try {
      if (isMochiyori && nextPhotoFile) {
        setUploadingNext(true);
        const imageUrl = await uploadRoomPhoto(roomId, nextRound, nextPhotoFile);
        setUploadingNext(false);
        await createRound(sessionId, nextRound, {
          text: nextPhotoCaption || "この写真で一言",
          genre: "その他",
          difficulty: "中級",
          imageUrl,
        }, room?.answerSeconds ?? 90);
      } else {
        const data = await (prefetchRef.current ?? prefetchQuestion());
        prefetchRef.current = null;
        await createRound(sessionId, nextRound, {
          text: data.question,
          genre: data.genre as Genre,
          difficulty: data.difficulty as Difficulty,
        }, room?.answerSeconds ?? 90);
      }
      await transitionPhase(sessionId, roundParam,
        { status: "done" },
        { currentRound: nextRound, status: "answering" },
      );
      setShowPhotoUpload(false);
      setNextPhotoFile(null);
      setNextPhotoPreview(null);
      setNextPhotoCaption("");
    } finally {
      advancingRef.current = false;
      setUploadingNext(false);
    }
  }, [session, room, isHost, sessionId, roundParam, roomId, nextPhotoFile, nextPhotoCaption]);

  const tally = tallyVotes(votes);
  const isAsync = session?.mode === "async";
  const gameMode = room?.gameMode ?? "classic";
  const nicknameOf = (userId: string) => members.find((m) => m.userId === userId)?.nickname ?? "?";

  const correctAnswerId = gameMode === "ai_hunt"
    ? answers.find((a) => a.userId === "ai")?.id ?? null
    : gameMode === "human_hunt"
    ? answers.find((a) => a.userId === round?.answererId)?.id ?? null
    : null;
  const { correctVoterIds, correctCount } = tallyGuesses(guesses, correctAnswerId);
  const revealAnswer = correctAnswerId ? answers.find((a) => a.id === correctAnswerId) ?? null : null;
  const answererName = round?.answererId ? nicknameOf(round.answererId) : "";
  const expectedGuessers = gameMode === "human_hunt"
    ? Math.max(0, (room?.memberIds.length ?? 1) - 1)
    : (room?.memberIds.length ?? 0);
  const answererBonus = Math.max(0, expectedGuessers - correctCount);
  const noAnswererData = gameMode === "human_hunt" && !revealAnswer;

  const aiScoreMap: Record<string, number> = {};
  if (isAsync && aiReviews.length > 0) {
    for (const r of aiReviews) {
      aiScoreMap[r.answerId] = (aiScoreMap[r.answerId] ?? 0) + r.score;
    }
    const personaCount = new Set(aiReviews.map((r) => r.persona)).size || 1;
    for (const key of Object.keys(aiScoreMap)) {
      aiScoreMap[key] = Math.round(aiScoreMap[key] / personaCount);
    }
  }

  const sorted = isAsync
    ? [...answers].sort((a, b) => (aiScoreMap[b.id] ?? 0) - (aiScoreMap[a.id] ?? 0))
    : [...answers].sort((a, b) => (tally[b.id]?.total ?? 0) - (tally[a.id]?.total ?? 0));
  const mvp = sorted[0];

  return (
    <div className="min-h-dvh flex flex-col bg-paper">
      {showInterstitial && (
        <InterstitialAd onClose={() => { setShowInterstitial(false); doFinish(); }} skipAfter={5} />
      )}

      {/* 持ち寄り写真アップロード（次ラウンド用） */}
      {showPhotoUpload && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,.5)" }}>
          <div
            className="w-full max-w-sm bg-paper animate-rise"
            style={{ borderRadius: "24px 24px 0 0", padding: "20px 20px 30px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-[14px]">
              <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 18 }}>
                次のお題写真
              </p>
              <button
                onClick={() => setShowPhotoUpload(false)}
                className="font-gothic text-sub"
                style={{ fontSize: 13 }}
              >
                キャンセル
              </button>
            </div>
            <input
              ref={nextFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleNextPhotoSelect}
            />
            {nextPhotoPreview ? (
              <div className="space-y-[10px]">
                <OdaiSheet
                  imageUrl={nextPhotoPreview}
                  text={nextPhotoCaption || "この写真で一言"}
                  roundNumber={session ? session.currentRound + 1 : undefined}
                />
                <input
                  className="w-full bg-white font-gothic font-bold text-[#1A1714] outline-none"
                  style={{ border: "1px solid rgba(0,0,0,.07)", borderRadius: 14, padding: "11px 14px", fontSize: 14 }}
                  placeholder="お題テキスト（任意）"
                  maxLength={30}
                  value={nextPhotoCaption}
                  onChange={(e) => setNextPhotoCaption(e.target.value)}
                />
                <div className="flex gap-[8px]">
                  <button
                    onClick={() => { setNextPhotoFile(null); setNextPhotoPreview(null); }}
                    className="flex-1 font-gothic font-bold text-sub active:scale-[0.98] transition-transform"
                    style={{ fontSize: 13, padding: "12px 0", borderRadius: 14, border: "1px solid rgba(0,0,0,.1)" }}
                  >
                    変更
                  </button>
                  <button
                    onClick={goNext}
                    disabled={uploadingNext}
                    className="flex-1 font-mincho font-extrabold text-paper active:scale-[0.98] transition-all disabled:opacity-40"
                    style={{ fontSize: 15, padding: "12px 0", borderRadius: 14, background: "#2BA35F" }}
                  >
                    {uploadingNext ? "アップロード中…" : "この写真で開始"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => nextFileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-[8px] active:scale-[0.98] transition-transform"
                style={{
                  borderRadius: 18, padding: "28px 16px",
                  border: "2px dashed #E0A93B",
                  background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E0A93B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <p className="font-gothic font-extrabold text-[#9A6410]" style={{ fontSize: 13 }}>写真を選ぶ</p>
                <p className="font-gothic text-sub" style={{ fontSize: 11 }}>カメラロールからお題写真をアップロード</p>
              </button>
            )}
            {nextPhotoError && <p className="font-gothic text-red mt-1" style={{ fontSize: 11 }}>{nextPhotoError}</p>}
          </div>
        </div>
      )}

      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[14px] flex items-center justify-between">
        <div>
          <p className="font-gothic text-sub" style={{ fontSize: 11 }}>ラウンド {roundParam} 結果</p>
          <h1 className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 21 }}>大入満員御礼</h1>
        </div>
        <span
          className="font-gothic font-extrabold"
          style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "#E6F5EC", color: "#2BA35F" }}
        >
          大入満員御礼
        </span>
      </div>

      {gameMode === "classic" && (
      <>
      {/* 横綱カード */}
      {mvp && (
        <div
          className="mx-[20px] mb-[14px] relative overflow-hidden text-center animate-pop-in"
          style={{ borderRadius: 24, padding: "22px 20px 24px", background: "linear-gradient(150deg,#E5402F,#F0922B)" }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 0%,rgba(255,255,255,.25),transparent 50%)" }} />
          <div className="relative">
            <p className="font-mincho font-extrabold text-paper" style={{ fontSize: 15, letterSpacing: "0.3em", color: "#FFE9B0" }}>横　綱</p>
            <Engimono name="daruma" width={78} height={86} style={{ margin: "6px auto 2px", display: "block" }} />
            <p className="font-mincho font-extrabold text-paper" style={{ fontSize: 21, lineHeight: 1.5 }}>「{mvp.text}」</p>
            <div
              className="inline-flex items-center gap-[7px] font-gothic font-extrabold text-paper mt-3"
              style={{ fontSize: 14, padding: "7px 16px", borderRadius: 999, background: "rgba(0,0,0,.22)" }}
            >
              {isAsync ? (
                <>
                  <span style={{ fontSize: 16 }}>🎯</span>
                  AI審査 {aiScoreMap[mvp.id] ?? 0}点
                </>
              ) : (
                <>
                  <svg width="16" height="14" viewBox="0 0 30 24"><path d="M5 6h20l3 6-3 6H5L2 12z" fill="#F4C422"/></svg>
                  座布団 {tally[mvp.id]?.total ?? 0}枚
                </>
              )}
            </div>
            <StampBar answerId={mvp.id} stamps={stamps} uid={uid} sessionId={sessionId} roundId={roundParam} />
          </div>
        </div>
      )}

      {/* 番付リスト */}
      <div className="flex-1 px-[20px] pb-[12px] flex flex-col gap-[9px]">
        {sorted.slice(1).map((a, i) => {
          const label = RANK_LABELS[i] ?? "前頭";
          const color = RANK_COLORS[i] ?? RANK_COLORS[2];
          return (
            <div
              key={a.id}
              className="bg-white"
              style={{ borderRadius: 15, padding: "11px 14px", border: "1px solid rgba(0,0,0,.07)" }}
            >
              <div className="flex items-center gap-[13px]">
                <span className="font-mincho font-extrabold" style={{ fontSize: 14, width: 34, color }}>{label}</span>
                <div
                  className="rounded-full shrink-0"
                  style={{ width: 30, height: 30, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-gothic font-extrabold text-[#1A1714] truncate" style={{ fontSize: 14 }}>{a.text}</p>
                </div>
                <span className="font-gothic font-extrabold shrink-0" style={{ fontSize: 14, color: isAsync ? "#1A1714" : "#E5402F" }}>
                  {isAsync ? `${aiScoreMap[a.id] ?? 0}点` : `${tally[a.id]?.total ?? 0}枚`}
                </span>
              </div>
              <StampBar answerId={a.id} stamps={stamps} uid={uid} sessionId={sessionId} roundId={roundParam} />
            </div>
          );
        })}

        {/* AI講評 */}
        {aiReviews.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="font-gothic font-extrabold text-sub" style={{ fontSize: 12 }}>AI審査員の講評</p>
            {isAsync ? (
              sorted.map((a) => {
                const reviews = aiReviews.filter((r) => r.answerId === a.id);
                if (reviews.length === 0) return null;
                return (
                  <div key={a.id} className="bg-white" style={{ borderRadius: 16, padding: 14, border: "1px solid rgba(0,0,0,.07)" }}>
                    <p className="font-gothic font-extrabold text-[#1A1714] mb-[8px]" style={{ fontSize: 14 }}>
                      「{a.text}」
                    </p>
                    <div className="flex flex-col gap-[8px]">
                      {reviews.map((rev) => {
                        const color = rev.persona === "王道" ? "#F4C422" : "#E5402F";
                        return (
                          <div key={rev.id} style={{ paddingLeft: 10, borderLeft: `3px solid ${color}` }}>
                            <div className="flex items-center gap-[6px] mb-[2px]">
                              <span className="font-gothic font-bold" style={{ fontSize: 12, color }}>
                                {rev.persona === "王道" ? "👑" : "🔪"} {rev.persona}
                              </span>
                              <span className="font-gothic font-extrabold" style={{ fontSize: 12, color }}>{rev.score}点</span>
                            </div>
                            <p className="font-gothic text-[#52493A]" style={{ fontSize: 12, lineHeight: 1.5 }}>{rev.comment}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              ["王道", "辛口"].map((persona) => {
                const personaReviews = aiReviews.filter((r) => r.persona === persona);
                if (personaReviews.length === 0) return null;
                const topReview = personaReviews.sort((a, b) => b.score - a.score)[0];
                const topAnswer = answers.find((a) => a.id === topReview.answerId);
                const color = persona === "王道" ? "#F4C422" : "#E5402F";
                return (
                  <div key={persona} className="bg-white" style={{ borderRadius: 16, padding: 14, border: "1px solid rgba(0,0,0,.07)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-gothic font-bold" style={{ fontSize: 13, color }}>{persona === "王道" ? "👑" : "🔪"} {persona}AI</p>
                      <span className="font-gothic font-bold" style={{ fontSize: 13, color }}>{topReview.score}点</span>
                    </div>
                    <p className="font-gothic text-sub" style={{ fontSize: 12 }}>「{topAnswer?.text ?? ""}」</p>
                    <p className="font-gothic text-[#1A1714]" style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>{topReview.comment}</p>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* AI審査中インジケーター */}
        {isAsync && aiReviews.length === 0 && round?.status === "reviewing" && (
          <div className="mt-2 text-center py-6" style={{ borderRadius: 16, border: "1.5px dashed rgba(0,0,0,.12)", background: "rgba(255,255,255,.4)" }}>
            <div className="w-6 h-6 mx-auto mb-2 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#F4C422", borderTopColor: "transparent" }} />
            <p className="font-gothic font-bold text-sub" style={{ fontSize: 13 }}>AI審査員が採点中…</p>
            <p className="font-gothic text-sub" style={{ fontSize: 11, marginTop: 2 }}>少々お待ちください</p>
          </div>
        )}
      </div>
      </>
      )}

      {/* AI/人間当てクイズ 結果発表 */}
      {gameMode !== "classic" && (
        <div className="flex-1 px-[20px] pb-[12px] flex flex-col gap-[12px]">
          {noAnswererData ? (
            <div className="text-center py-8" style={{ borderRadius: 18, border: "1.5px dashed rgba(0,0,0,.12)", background: "rgba(255,255,255,.5)" }}>
              <p className="font-gothic font-bold text-sub" style={{ fontSize: 14 }}>回答者が未回答だったため、このラウンドはノーカウントです</p>
            </div>
          ) : revealAnswer ? (
            <div
              className="relative overflow-hidden text-center animate-pop-in"
              style={{ borderRadius: 24, padding: "22px 20px 24px", background: "linear-gradient(150deg,#5BA9D6,#3E7FB0)" }}
            >
              <div className="relative">
                <p className="font-mincho font-extrabold text-paper" style={{ fontSize: 14, letterSpacing: "0.2em", color: "#E5F1FA" }}>
                  {gameMode === "ai_hunt" ? "正解発表：AIの回答はコレでした" : `正解発表：回答者は ${answererName} さんでした`}
                </p>
                <p className="font-mincho font-extrabold text-paper mt-[10px]" style={{ fontSize: 20, lineHeight: 1.5 }}>「{revealAnswer.text}」</p>
                <div
                  className="inline-flex items-center gap-[7px] font-gothic font-extrabold text-paper mt-3"
                  style={{ fontSize: 13, padding: "7px 16px", borderRadius: 999, background: "rgba(0,0,0,.22)" }}
                >
                  {correctCount}/{expectedGuessers}人が見破りました
                </div>
                {gameMode === "human_hunt" && (
                  <p className="font-gothic font-bold text-paper mt-[10px]" style={{ fontSize: 13 }}>
                    {answererName}さんに見破られなかったボーナス +{answererBonus}
                  </p>
                )}
                <StampBar answerId={revealAnswer.id} stamps={stamps} uid={uid} sessionId={sessionId} roundId={roundParam} />
              </div>
            </div>
          ) : null}

          {correctVoterIds.length > 0 && (
            <div className="bg-white" style={{ borderRadius: 16, padding: 14, border: "1px solid rgba(0,0,0,.07)" }}>
              <p className="font-gothic font-extrabold text-sub mb-[8px]" style={{ fontSize: 12 }}>正解した人</p>
              <div className="flex flex-wrap gap-[6px]">
                {correctVoterIds.map((vid) => (
                  <span
                    key={vid}
                    className="font-gothic font-extrabold"
                    style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, background: "#E6F5EC", color: "#2BA35F" }}
                  >
                    {nicknameOf(vid)}{vid === uid ? "（あなた）" : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex gap-[10px] px-[20px] pb-[40px]">
        {session?.mode === "async" ? (
          <button
            onClick={async () => {
              if (round?.status === "reviewing") {
                await updateRound(sessionId, roundParam, { status: "done" });
              }
              router.push(`/rooms/${roomId}/game?sid=${sessionId}`);
            }}
            className="flex-1 font-gothic font-bold text-sub active:scale-[0.98] transition-transform"
            style={{ fontSize: 14, padding: "16px 0", borderRadius: 18, border: "1px solid rgba(0,0,0,.1)" }}
          >
            ← お題一覧に戻る
          </button>
        ) : isHost ? (
          <>
            <button
              onClick={goNext}
              className="flex-1 font-mincho font-extrabold text-paper active:scale-[0.98] transition-all"
              style={{ fontSize: 18, padding: "16px 0", borderRadius: 17, background: "#2BA35F", boxShadow: "0 14px 26px -10px rgba(43,163,95,.6)" }}
            >
              {session && session.currentRound >= session.totalRounds ? "最終結果を見る" : "次のお題へ"}
            </button>
          </>
        ) : (
          <p className="w-full text-center font-gothic text-sub py-4" style={{ fontSize: 14 }}>ホストの操作を待っています…</p>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    }>
      <ResultPageContent />
    </Suspense>
  );
}
