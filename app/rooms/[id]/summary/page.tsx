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
import AdSlot from "@/components/AdSlot";

const RANK_LABELS = ["横綱", "大関", "関脇", "小結", "前頭"];
const RANK_COLORS = ["#E5402F", "#2BA35F", "#E0A93B", "#F0922B", "#7A6F5C"];

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink">
        <svg className="w-16 h-[70px] animate-spinslow" style={{ animationDuration: "3s" }}>
          <use href="#c-daruma" width="100%" height="100%"/>
        </svg>
        <p className="text-text-muted text-sm font-bold">結果を集計中…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-8 bg-ink">

      {/* Header */}
      <div className="text-center mb-6 animate-pop-in">
        <p className="text-text-muted text-[11px] font-bold tracking-wide mb-1">{room?.name}</p>
        <h1 className="font-display text-text text-3xl font-bold">千秋楽</h1>
        <p className="text-text-muted text-xs mt-1">本日はご来場まことにありがとうございました</p>
      </div>

      {/* Champion card */}
      {champion && (
        <div
          className="relative rounded-[24px] px-5 py-6 mb-5 text-center overflow-hidden animate-pop-in text-[#FBF7EC]"
          style={{ background: "linear-gradient(150deg,#E5402F,#F0922B)" }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 0%,rgba(255,255,255,.25),transparent 50%)" }}/>
          <div className="relative">
            <p className="font-display font-bold text-[15px] tracking-[0.3em] mb-1" style={{ color: "#FFE9B0" }}>本日の横綱</p>
            <svg className="w-20 h-[88px] mx-auto my-2 block">
              <use href="#c-daruma" width="100%" height="100%"/>
            </svg>
            <p className="font-display font-bold text-xl leading-snug mt-2">
              {champion.userId === uid ? "🎉 あなた！" : champion.nickname}
            </p>
            <div
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full font-bold text-sm"
              style={{ background: "rgba(0,0,0,.22)" }}
            >
              <svg width="16" height="14" viewBox="0 0 30 24"><path d="M5 6h20l3 6-3 6H5L2 12z" fill="#F4C422"/></svg>
              座布団 {champion.total}枚
            </div>
          </div>
        </div>
      )}

      <AdSlot id="summary-banner" className="mb-5" />

      {/* Score ranking / 番付 */}
      <div className="space-y-2.5 mb-8">
        <p className="text-xs text-text-muted font-bold">番付表</p>
        {playerScores.map((p, i) => {
          const rankLabel = RANK_LABELS[i] ?? "前頭";
          const rankColor = RANK_COLORS[i] ?? RANK_COLORS[4];
          const isMe = p.userId === uid;
          return (
            <div
              key={p.userId}
              className="flex items-center gap-3 rounded-[15px] px-4 py-3 animate-rise"
              style={{
                background: isMe ? "#EBE2CF" : "#ffffff",
                border: isMe ? "1.5px solid #E0A93B" : "1px solid rgba(0,0,0,.07)",
              }}
            >
              <span className="font-display font-bold text-sm w-10 flex-none" style={{ color: rankColor }}>
                {rankLabel}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-text truncate">
                  {isMe ? `${p.nickname}（あなた）` : p.nickname}
                </p>
              </div>
              <span className="font-bold text-sm flex-none" style={{ color: "#E5402F" }}>
                {p.total}枚
              </span>
            </div>
          );
        })}
      </div>

      {/* 志向AI診断 */}
      {analyses.length > 0 && (
        <div className="space-y-3 mb-8">
          <p className="text-xs text-text-muted font-bold">AI 志向診断</p>
          {analyses.map((a) => {
            const isMe = a.userId === uid;
            return (
              <div
                key={a.userId}
                className="rounded-2xl p-4 space-y-1.5 animate-rise"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,.07)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text font-bold">
                    {isMe ? `${a.nickname}（あなた）` : a.nickname}
                  </p>
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ color: "#7A6F5C", background: "#EBE2CF" }}
                  >
                    {a.tendency}
                  </span>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">{a.comment}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Round highlights */}
      <div className="space-y-3 mb-8">
        <p className="text-xs text-text-muted font-bold">各ラウンドのMVP</p>
        {roundSummaries.map((s) => (
          <div
            key={s.round}
            className="bg-surface rounded-[15px] p-4 space-y-2"
            style={{ border: "1px solid rgba(0,0,0,.07)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ color: "#E5402F", background: "#FCE7E3" }}
              >
                第{s.round}問
              </span>
              <p className="text-text-muted text-xs truncate">「{s.question}」</p>
            </div>
            {s.mvp ? (
              <div className="flex items-center gap-2">
                <svg width="14" height="12" viewBox="0 0 30 24" className="flex-none">
                  <path d="M5 6h20l3 6-3 6H5L2 12z" fill="#F4C422"/>
                </svg>
                <p className="text-text text-sm font-bold">{s.mvp.text}</p>
                <span className="text-text-muted text-xs ml-auto">{s.mvp.total}枚</span>
              </div>
            ) : (
              <p className="text-xs text-text-faint">データなし</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div
          className="bg-surface rounded-[18px] p-4 space-y-1.5"
          style={{ border: "1px solid rgba(0,0,0,.07)" }}
        >
          <p className="text-xs text-text-muted font-bold">シェアする前にひと言</p>
          <p className="text-xs text-text-muted leading-relaxed">
            あなたはプロの芸人ではありません。良い評価を得ても、SNSで自慢したり芸人さんをいじったりするのはやめましょう。笑いは仲間内で楽しむものです 🎤
          </p>
        </div>

        <button
          onClick={() => {
            const text = `大喜利Pocket「${room?.name ?? ""}」\n🏆 ${champion?.total ?? 0}枚で千秋楽！\n#大喜利Pocket`;
            if (navigator.share) {
              navigator.share({ text });
            } else {
              navigator.clipboard.writeText(text);
            }
          }}
          className="flex items-center justify-center gap-2 w-full font-bold py-4 rounded-2xl text-sm text-[#FBF7EC] active:scale-[0.98] transition-all"
          style={{ background: "#2BA35F", boxShadow: "0 14px 26px -10px rgba(43,163,95,.5)" }}
        >
          結果をシェア
        </button>
        <Link
          href="/rooms"
          className="block text-center text-text-muted text-sm py-2 font-bold"
        >
          寄合所に戻る
        </Link>
      </div>
    </div>
  );
}
