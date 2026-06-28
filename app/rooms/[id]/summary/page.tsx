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
import Mascot from "@/components/Mascot";
import AdSlot from "@/components/AdSlot";

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

        // メンバーのニックネームを取得
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

        // 志向AI分析（全員分を並列実行）
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
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="space-y-3 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin mx-auto" />
          <p className="text-zinc-500 text-sm">結果を集計中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-12">
      <div className="text-center mb-8 animate-pop-in">
        <h1 className="font-display text-pop-yellow text-3xl mb-1">最終結果</h1>
        <p className="text-zinc-500 text-sm">{room?.name}</p>
      </div>

      {/* Champion card */}
      {champion && (
        <div className="bg-pop-yellow/10 border-2 border-pop-yellow/60 rounded-3xl p-6 mb-6 text-center space-y-3 animate-pop-in">
          <Mascot kind="trophy" size={48} tint="#FFD600" className="mx-auto animate-crown-bob" />
          <p className="font-display text-pop-yellow text-xl">今日の優勝</p>
          <p className="text-white text-base">{champion.userId === uid ? "🎉 あなた！" : champion.nickname}</p>
          <p className="text-zinc-400 text-sm">{champion.total}票獲得</p>
        </div>
      )}

      <AdSlot id="summary-banner" className="mb-6" />

      {/* Score ranking */}
      <div className="space-y-2 mb-8">
        <p className="text-xs text-zinc-500 tracking-wide">スコアランキング</p>
        {playerScores.map((p, i) => (
          <div
            key={p.userId}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 animate-rise ${
              p.userId === uid
                ? "border-pop-yellow/40 bg-pop-yellow/5"
                : "border-line bg-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 text-sm w-5 font-bold">{i + 1}</span>
              <span className="text-white text-sm">
                {p.userId === uid ? `${p.nickname}（あなた）` : p.nickname}
              </span>
            </div>
            <span className="text-pop-yellow font-bold text-sm">{p.total}票</span>
          </div>
        ))}
      </div>

      {/* 志向AI診断 */}
      {analyses.length > 0 && (
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-2">
            <Mascot kind="sparkle" size={14} tint="#BF5FFF" />
            <p className="text-xs text-zinc-500 tracking-wide">あなたの志向AI診断</p>
          </div>
          {analyses.map((a) => (
            <div
              key={a.userId}
              className={`rounded-2xl border p-4 space-y-1.5 animate-rise ${
                a.userId === uid
                  ? "border-pop-purple/40 bg-pop-purple/5"
                  : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-white font-medium">
                  {a.userId === uid ? `${a.nickname}（あなた）` : a.nickname}
                </p>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ color: "#BF5FFF", background: "rgba(191,95,255,0.15)" }}
                >
                  {a.tendency}
                </span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">{a.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Round highlights */}
      <div className="space-y-3 mb-8">
        <p className="text-xs text-zinc-500 tracking-wide">各ラウンドのMVP</p>
        {roundSummaries.map((s) => (
          <div key={s.round} className="bg-surface border border-line rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-pop-yellow font-bold bg-pop-yellow/10 rounded-full px-2 py-0.5">
                R{s.round}
              </span>
              <p className="text-zinc-500 text-xs truncate">「{s.question}」</p>
            </div>
            {s.mvp ? (
              <div className="flex items-start gap-2">
                <Mascot kind="crown" size={14} tint="#FFD600" className="mt-0.5 shrink-0" />
                <p className="text-white text-sm">{s.mvp.text}</p>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">データなし</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* 注意書き */}
        <div className="bg-surface border border-zinc-800 rounded-2xl p-4 space-y-1.5 mb-1">
          <p className="text-xs text-zinc-500 font-bold">シェアする前にひと言</p>
          <p className="text-xs text-zinc-600 leading-relaxed">
            あなたはプロの芸人ではありません。良い評価を得ても、SNSで自慢したり芸人さんをいじったりするのはやめましょう。笑いは仲間内で楽しむものです 🎤
          </p>
        </div>

        <Link
          href={`/rooms/${roomId}/analysis?sid=${sessionId}`}
          className="flex items-center justify-center gap-2 w-full bg-surface border border-line text-white text-sm font-medium py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <Mascot kind="bars" size={16} tint="#FFFFFF" />
          笑い分析を見る
        </Link>
        <button
          onClick={() => {
            const text = `大喜利Pocket「${room?.name ?? ""}」\n🏆 ${champion?.total ?? 0}票でゲーム終了！\n#大喜利Pocket`;
            if (navigator.share) {
              navigator.share({ text });
            } else {
              navigator.clipboard.writeText(text);
            }
          }}
          className="flex items-center justify-center gap-2 w-full border border-pop-yellow/40 text-pop-yellow text-sm font-medium py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <Mascot kind="link" size={16} tint="#FFD600" />
          結果をシェア
        </button>
        <Link
          href="/rooms"
          className="block text-center text-zinc-500 text-sm py-2"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
