"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import { tallyVotes } from "@/lib/ogiri/sessions";
import type { RoomDoc, AnswerDoc, VoteDoc, AiReviewDoc, Reaction } from "@/lib/types";
import Mascot from "@/components/Mascot";

interface Stats {
  totalGames: number;
  totalVotes: number;
  reactionDist: Record<Reaction, number>;
  genreDist: Record<string, number>;
  topAnswers: { text: string; total: number }[];
  avgAiScores: Record<string, number>;
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white">{label}</span>
        <span className="font-bold" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full bg-line overflow-hidden">
        <div
          className="h-full rounded-full animate-bar-grow origin-left"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") ?? "";

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeRoom(roomId, setRoom);
    return unsub;
  }, [roomId]);

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        const roundsSnap = await getDocs(collection(db, "sessions", sessionId, "rounds"));
        const reactionDist: Record<Reaction, number> = { funny: 0, smart: 0, crazy: 0 };
        const genreDist: Record<string, number> = {};
        const aiScoreMap: Record<string, { sum: number; count: number }> = {};
        const topAnswersMap: { text: string; total: number }[] = [];
        let totalVotes = 0;

        for (const roundDoc of roundsSnap.docs) {
          const rdata = roundDoc.data();
          const genre = rdata.question?.genre ?? "その他";
          genreDist[genre] = (genreDist[genre] ?? 0) + 1;

          const answersSnap = await getDocs(
            collection(db, "sessions", sessionId, "rounds", roundDoc.id, "answers")
          );
          const votesSnap = await getDocs(
            collection(db, "sessions", sessionId, "rounds", roundDoc.id, "votes")
          );
          const reviewsSnap = await getDocs(
            collection(db, "sessions", sessionId, "rounds", roundDoc.id, "aiReviews")
          );

          const answers = answersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as AnswerDoc));
          const votes = votesSnap.docs.map((d) => d.data() as VoteDoc);
          const tally = tallyVotes(votes);

          for (const v of votes) {
            reactionDist[v.reaction]++;
            totalVotes++;
          }

          for (const a of answers) {
            topAnswersMap.push({ text: a.text, total: tally[a.id]?.total ?? 0 });
          }

          for (const r of reviewsSnap.docs) {
            const review = r.data() as AiReviewDoc;
            if (!aiScoreMap[review.persona]) aiScoreMap[review.persona] = { sum: 0, count: 0 };
            aiScoreMap[review.persona].sum += review.score;
            aiScoreMap[review.persona].count++;
          }
        }

        const avgAiScores: Record<string, number> = {};
        for (const [p, { sum, count }] of Object.entries(aiScoreMap)) {
          avgAiScores[p] = count > 0 ? sum / count : 0;
        }

        topAnswersMap.sort((a, b) => b.total - a.total);

        setStats({
          totalGames: roundsSnap.size,
          totalVotes,
          reactionDist,
          genreDist,
          topAnswers: topAnswersMap.slice(0, 5),
          avgAiScores,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  const totalReactions = stats ? Object.values(stats.reactionDist).reduce((s, n) => s + n, 0) : 0;

  return (
    <div className="min-h-screen pb-24 px-4 pt-12">
      <Link
        href={`/rooms/${roomId}/summary?sid=${sessionId}`}
        className="flex items-center gap-1 text-zinc-500 text-sm mb-6"
      >
        ← 結果に戻る
      </Link>

      <h1 className="font-display text-pop-yellow text-2xl mb-1">笑い分析</h1>
      <p className="text-zinc-500 text-xs mb-8">{room?.name}</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin" />
        </div>
      ) : !stats ? (
        <p className="text-zinc-500 text-sm text-center">データがありません</p>
      ) : (
        <div className="space-y-8">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "ラウンド数", value: stats.totalGames, unit: "回" },
              { label: "総投票数", value: stats.totalVotes, unit: "票" },
            ].map((s) => (
              <div key={s.label} className="bg-surface border border-line rounded-2xl p-4 text-center animate-pop-in">
                <p className="font-display text-pop-yellow text-3xl">{s.value}{s.unit}</p>
                <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Reaction distribution */}
          <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
            <p className="text-xs text-zinc-500 tracking-wide">このグループの反応傾向</p>
            <StatBar
              label="😂 面白い"
              value={totalReactions ? (stats.reactionDist.funny / totalReactions) * 100 : 0}
              color="#FFD600"
            />
            <StatBar
              label="🧠 うまい"
              value={totalReactions ? (stats.reactionDist.smart / totalReactions) * 100 : 0}
              color="#00B4FF"
            />
            <StatBar
              label="🤯 狂ってる"
              value={totalReactions ? (stats.reactionDist.crazy / totalReactions) * 100 : 0}
              color="#BF5FFF"
            />
          </div>

          {/* AI average scores */}
          {Object.keys(stats.avgAiScores).length > 0 && (
            <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
              <p className="text-xs text-zinc-500 tracking-wide">AI審査員 平均点</p>
              {[
                { key: "王道", emoji: "👑", color: "#FFD600" },
                { key: "辛口", emoji: "🔪", color: "#FF4D6D" },
                { key: "カオス", emoji: "🌀", color: "#BF5FFF" },
              ].map(({ key, emoji, color }) => (
                <StatBar
                  key={key}
                  label={`${emoji} ${key}`}
                  value={stats.avgAiScores[key] ?? 0}
                  color={color}
                />
              ))}
              <p className="text-xs text-zinc-500 pt-2 border-t border-line">
                {stats.avgAiScores["カオス"] > stats.avgAiScores["王道"]
                  ? "🌀 このグループはシュール・カオス系が強い"
                  : stats.avgAiScores["辛口"] > 70
                  ? "🔥 辛口AIも認める高品質な回答が多い"
                  : "👑 王道的な笑いが得意なグループ"}
              </p>
            </div>
          )}

          {/* Top answers */}
          {stats.topAnswers.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 tracking-wide">殿堂入り回答 TOP5</p>
              {stats.topAnswers.map((a, i) => (
                <div key={i} className="flex items-start gap-3 bg-surface border border-line rounded-xl px-4 py-3 animate-rise">
                  <span className="font-display text-pop-yellow text-sm w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm leading-relaxed">{a.text}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{a.total}票</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
