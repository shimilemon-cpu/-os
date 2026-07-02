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
import { publishToEngawa } from "@/lib/ogiri/engawa";
import type { SessionDoc, RoundDoc, AnswerDoc, VoteDoc, AiReviewDoc, RoomDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";
import OdaiSheet from "@/components/OdaiSheet";
import InterstitialAd from "@/components/InterstitialAd";
import { validatePhoto, uploadRoomPhoto } from "@/lib/ogiri/photos";

type QuestionData = { question: string; genre: string; difficulty: string };

function prefetchQuestion(): Promise<QuestionData> {
  return fetch("/api/ogiri/question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }).then((r) => r.json() as Promise<QuestionData>);
}

const ANSWER_SECONDS = 90;
const RANK_LABELS = ["大関", "関脇", "前頭"];
const RANK_COLORS = ["#2BA35F", "#E0A93B", "#7A6F5C"];
const AVATAR_COLORS = ["#2BA35F", "#F4C422", "#D63384", "#E5402F", "#5BA9D6"];

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
    if (!session || !isHost || advancingRef.current) return;
    const nextRound = session.currentRound + 1;
    if (nextRound > session.totalRounds) {
      setShowInterstitial(true);
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
          genre: "その他" as never,
          difficulty: "中級" as never,
          imageUrl,
        }, ANSWER_SECONDS);
      } else {
        const data = await (prefetchRef.current ?? prefetchQuestion());
        prefetchRef.current = null;
        await createRound(sessionId, nextRound, {
          text: data.question,
          genre: data.genre as never,
          difficulty: data.difficulty as never,
        }, ANSWER_SECONDS);
      }
      await updateRound(sessionId, roundParam, { status: "done" });
      await updateSession(sessionId, { currentRound: nextRound, status: "answering" });
      setShowPhotoUpload(false);
      setNextPhotoFile(null);
      setNextPhotoPreview(null);
      setNextPhotoCaption("");
    } finally {
      advancingRef.current = false;
      setUploadingNext(false);
    }
  }, [session, isHost, sessionId, roundParam, room?.topicMode, roomId, nextPhotoFile, nextPhotoCaption]);

  const tally = tallyVotes(votes);
  const sorted = [...answers].sort((a, b) => (tally[b.id]?.total ?? 0) - (tally[a.id]?.total ?? 0));
  const mvp = sorted[0];

  return (
    <div className="min-h-screen flex flex-col bg-paper">
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
              <svg width="16" height="14" viewBox="0 0 30 24"><path d="M5 6h20l3 6-3 6H5L2 12z" fill="#F4C422"/></svg>
              座布団 {tally[mvp.id]?.total ?? 0}枚
            </div>
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
              className="bg-white flex items-center gap-[13px]"
              style={{ borderRadius: 15, padding: "11px 14px", border: "1px solid rgba(0,0,0,.07)" }}
            >
              <span className="font-mincho font-extrabold" style={{ fontSize: 14, width: 34, color }}>{label}</span>
              <div
                className="rounded-full shrink-0"
                style={{ width: 30, height: 30, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-gothic font-extrabold text-[#1A1714] truncate" style={{ fontSize: 14 }}>{a.text}</p>
              </div>
              <span className="font-gothic font-extrabold text-red shrink-0" style={{ fontSize: 14 }}>
                {tally[a.id]?.total ?? 0}枚
              </span>
            </div>
          );
        })}

        {/* AI講評 */}
        {aiReviews.length > 0 && (
          <div className="mt-2 space-y-2">
            <p className="font-gothic font-extrabold text-sub" style={{ fontSize: 12 }}>AI審査員の講評</p>
            {["王道", "辛口"].map((persona) => {
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
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-[10px] px-[20px] pb-[26px]">
        {isHost ? (
          <>
            <button
              className="bg-white grid place-items-center shrink-0 active:scale-95 transition-transform"
              style={{ width: 54, height: 54, borderRadius: 17, border: "1px solid rgba(0,0,0,.1)" }}
              onClick={() => {}}
              aria-label="再戦"
            >
              <Icon name="refresh" size={22} color="#1A1714" />
            </button>
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
