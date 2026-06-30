"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import { tallyVotes } from "@/lib/ogiri/sessions";
import type { RoomDoc, AnswerDoc, VoteDoc, AiAnalysisResult } from "@/lib/types";
import Engimono from "@/components/Engimono";

const RANK_LABELS = ["横綱", "大関", "関脇", "小結", "前頭"];
const RANK_COLORS = ["#E5402F", "#2BA35F", "#E0A93B", "#F0922B", "#7A6F5C"];
const AVATAR_COLORS = ["#E5402F", "#2BA35F", "#F4C422", "#5BA9D6", "#B6AC97"];

interface RoundSummary {
  round: number;
  question: string;
  mvp: { text: string; userId: string; total: number } | null;
}

export default function SummaryPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") ?? "";

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [roundSummaries, setRoundSummaries] = useState<RoundSummary[]>([]);
  const [playerScores, setPlayerScores] = useState<{ userId: string; nickname: string; total: number }[]>([]);
  const [analyses, setAnalyses] = useState<AiAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser?.uid ?? "";

  useEffect(() => {
    const unsub = subscribeRoom(roomId, setRoom);
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        const roundsSnap = await getDocs(collection(db, "sessions", sessionId, "rounds"));
        const summaries: RoundSummary[] = [];
        const scoreMap: Record<string, number> = {};
        const nicknameMap: Record<string, string> = {};
        const answersByUser: Record<string, string[]> = {};

        for (const roundDoc of roundsSnap.docs) {
          const roundData = roundDoc.data();
          const answersSnap = await getDocs(
            collection(db, "sessions", sessionId, "rounds", roundDoc.id, "answers")
          );
          const votesSnap = await getDocs(
            collection(db, "sessions", sessionId, "rounds", roundDoc.id, "votes")
          );

          const answers = answersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AnswerDoc));
          const votes = votesSnap.docs.map((d) => d.data() as VoteDoc);
          const tally = tallyVotes(votes);

          for (const a of answers) {
            scoreMap[a.userId] = (scoreMap[a.userId] ?? 0) + (tally[a.id]?.total ?? 0);
            if (!answersByUser[a.userId]) answersByUser[a.userId] = [];
            answersByUser[a.userId].push(a.text);
          }

          const sorted = [...answers].sort(
            (a, b) => (tally[b.id]?.total ?? 0) - (tally[a.id]?.total ?? 0)
          );
          const mvpAnswer = sorted[0];
          summaries.push({
            round: Number(roundDoc.id),
            question: roundData.question?.text ?? "",
            mvp: mvpAnswer
              ? { text: mvpAnswer.text, userId: mvpAnswer.userId, total: tally[mvpAnswer.id]?.total ?? 0 }
              : null,
          });
        }

        const membersSnap = await getDocs(collection(db, "rooms", roomId, "members"));
        for (const d of membersSnap.docs) {
          nicknameMap[d.id] = (d.data().nickname as string) ?? d.id;
        }

        summaries.sort((a, b) => a.round - b.round);
        const scores = Object.entries(scoreMap)
          .map(([userId, total]) => ({ userId, nickname: nicknameMap[userId] ?? "Player", total }))
          .sort((a, b) => b.total - a.total);
        setRoundSummaries(summaries);
        setPlayerScores(scores);

        const analysisTasks = scores.map(async (p) => {
          const userAnswers = answersByUser[p.userId] ?? [];
          if (userAnswers.length === 0) {
            return { userId: p.userId, nickname: p.nickname, tendency: "謎の存在", comment: "回答がありませんでした" };
          }
          try {
            const res = await fetch("/api/ogiri/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answers: userAnswers, nickname: p.nickname }),
            });
            const data = await res.json() as { tendency: string; comment: string };
            return { userId: p.userId, nickname: p.nickname, tendency: data.tendency, comment: data.comment };
          } catch {
            return { userId: p.userId, nickname: p.nickname, tendency: "謎の存在", comment: "分析できませんでした" };
          }
        });
        const results = await Promise.all(analysisTasks);
        setAnalyses(results);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId, roomId]);

  const champion = playerScores[0];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-paper">
        <Engimono name="daruma" width={64} height={70} style={{ animation: "spinslow 3s linear infinite" }} />
        <p className="font-gothic font-bold text-sub" style={{ fontSize: 14 }}>結果を集計中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[30px]">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[14px] text-center">
        <p className="font-gothic text-sub mb-1" style={{ fontSize: 11 }}>{room?.name}</p>
        <h1 className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 28 }}>千　秋　楽</h1>
        <p className="font-gothic text-sub mt-1" style={{ fontSize: 11 }}>ご来場まことにありがとうございました</p>
      </div>

      {/* 横綱カード */}
      {champion && (
        <div
          className="mx-[20px] mb-[14px] relative overflow-hidden text-center animate-pop-in"
          style={{ borderRadius: 24, padding: "22px 20px 24px", background: "linear-gradient(150deg,#E5402F,#F0922B)" }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 0%,rgba(255,255,255,.25),transparent 50%)" }} />
          <div className="relative">
            <p className="font-mincho font-extrabold" style={{ fontSize: 15, letterSpacing: "0.3em", color: "#FFE9B0" }}>本日の横綱</p>
            <Engimono name="daruma" width={78} height={86} style={{ margin: "8px auto 4px", display: "block" }} />
            <p className="font-mincho font-extrabold text-paper" style={{ fontSize: 20, lineHeight: 1.4 }}>
              {champion.userId === uid ? "🎉 あなた！" : champion.nickname}
            </p>
            <div
              className="inline-flex items-center gap-[7px] font-gothic font-extrabold text-paper mt-3"
              style={{ fontSize: 14, padding: "7px 16px", borderRadius: 999, background: "rgba(0,0,0,.22)" }}
            >
              <svg width="16" height="14" viewBox="0 0 30 24"><path d="M5 6h20l3 6-3 6H5L2 12z" fill="#F4C422"/></svg>
              座布団 {champion.total}枚
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 px-[20px] flex flex-col gap-[18px]">
        {/* 番付表 */}
        <div>
          <p className="font-gothic font-extrabold text-sub mb-[9px]" style={{ fontSize: 12 }}>番付表</p>
          <div className="flex flex-col gap-[8px]">
            {playerScores.map((p, i) => {
              const isMe = p.userId === uid;
              return (
                <div
                  key={p.userId}
                  className="flex items-center gap-[12px] animate-rise"
                  style={{
                    borderRadius: 15, padding: "11px 14px",
                    background: isMe ? "#EBE2CF" : "#ffffff",
                    border: isMe ? "1.5px solid #E0A93B" : "1px solid rgba(0,0,0,.07)",
                  }}
                >
                  <div
                    className="rounded-full shrink-0"
                    style={{ width: 32, height: 32, background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  />
                  <span className="font-mincho font-extrabold" style={{ fontSize: 13, width: 36, color: RANK_COLORS[i] ?? RANK_COLORS[4] }}>
                    {RANK_LABELS[i] ?? "前頭"}
                  </span>
                  <p className="font-gothic font-extrabold text-[#1A1714] flex-1 truncate" style={{ fontSize: 14 }}>
                    {isMe ? `${p.nickname}（あなた）` : p.nickname}
                  </p>
                  <span className="font-gothic font-extrabold shrink-0" style={{ fontSize: 14, color: "#E5402F" }}>
                    {p.total}枚
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI 志向診断 */}
        {analyses.length > 0 && (
          <div>
            <p className="font-gothic font-extrabold text-sub mb-[9px]" style={{ fontSize: 12 }}>AI 志向診断</p>
            <div className="flex flex-col gap-[8px]">
              {analyses.map((a) => {
                const isMe = a.userId === uid;
                return (
                  <div
                    key={a.userId}
                    className="bg-white animate-rise"
                    style={{ borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(0,0,0,.07)" }}
                  >
                    <div className="flex items-center justify-between mb-[6px]">
                      <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 14 }}>
                        {isMe ? `${a.nickname}（あなた）` : a.nickname}
                      </p>
                      <span
                        className="font-gothic font-extrabold"
                        style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, color: "#7A6F5C", background: "#EBE2CF" }}
                      >
                        {a.tendency}
                      </span>
                    </div>
                    <p className="font-gothic text-sub" style={{ fontSize: 13, lineHeight: 1.6 }}>{a.comment}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 各ラウンドMVP */}
        <div>
          <p className="font-gothic font-extrabold text-sub mb-[9px]" style={{ fontSize: 12 }}>各ラウンドのMVP</p>
          <div className="flex flex-col gap-[8px]">
            {roundSummaries.map((s) => (
              <div
                key={s.round}
                className="bg-white"
                style={{ borderRadius: 15, padding: "12px 14px", border: "1px solid rgba(0,0,0,.07)" }}
              >
                <div className="flex items-center gap-[8px] mb-[6px]">
                  <span
                    className="font-gothic font-extrabold"
                    style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, color: "#E5402F", background: "#FCE7E3" }}
                  >
                    第{s.round}問
                  </span>
                  <p className="font-gothic text-sub truncate" style={{ fontSize: 11 }}>「{s.question}」</p>
                </div>
                {s.mvp ? (
                  <div className="flex items-center gap-[8px]">
                    <svg width="13" height="11" viewBox="0 0 30 24" className="shrink-0">
                      <path d="M5 6h20l3 6-3 6H5L2 12z" fill="#F4C422"/>
                    </svg>
                    <p className="font-gothic font-extrabold text-[#1A1714] flex-1" style={{ fontSize: 14 }}>{s.mvp.text}</p>
                    <span className="font-gothic text-sub shrink-0" style={{ fontSize: 11 }}>{s.mvp.total}枚</span>
                  </div>
                ) : (
                  <p className="font-gothic text-sub" style={{ fontSize: 12 }}>データなし</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* アクション */}
        <div className="flex flex-col gap-[10px] mt-2">
          <button
            onClick={() => {
              const text = `大喜利Pocket「${room?.name ?? ""}」\n🏆 ${champion?.total ?? 0}枚で千秋楽！\n#大喜利Pocket`;
              if (navigator.share) navigator.share({ text });
              else navigator.clipboard.writeText(text);
            }}
            className="w-full font-mincho font-extrabold text-paper active:scale-[0.98] transition-all"
            style={{ fontSize: 17, padding: "16px 0", borderRadius: 18, background: "#2BA35F", boxShadow: "0 14px 26px -10px rgba(43,163,95,.5)" }}
          >
            結果をシェア
          </button>
          <Link
            href="/rooms"
            className="block text-center font-gothic font-bold text-sub py-2"
            style={{ fontSize: 14 }}
          >
            寄合所に戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
