"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import { tallyVotes } from "@/lib/ogiri/sessions";
import type { RoomDoc, AnswerDoc, VoteDoc, AiReviewDoc, Reaction } from "@/lib/types";

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
        <span className="text-text-sub font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#EBE2CF" }}>
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
    <div className="min-h-screen pb-24 px-5 pt-8 bg-ink">
      <Link
        href={`/rooms/${roomId}/summary?sid=${sessionId}`}
        className="inline-flex items-center gap-1 text-text-muted text-sm font-bold mb-6"
      >
        ← 結果に戻る
      </Link>

      <div className="mb-6">
        <p className="text-text-muted text-[11px] font-bold mb-0.5">{room?.name}</p>
        <h1 className="font-display text-text text-2xl font-bold">笑い分析</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-pop-red border-t-transparent animate-spin" />
        </div>
      ) : !stats ? (
        <p className="text-text-muted text-sm text-center">データがありません</p>
      ) : (
        <div className="space-y-6">
          {/* Overview */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "ラウンド数", value: stats.totalGames, unit: "回", color: "#2BA35F" },
              { label: "座布団の総枚数", value: stats.totalVotes, unit: "枚", color: "#E5402F" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-surface rounded-[18px] p-4 text-center animate-pop-in"
                style={{ border: "1px solid rgba(0,0,0,.07)" }}
              >
                <p className="font-display font-bold text-3xl" style={{ color: s.color }}>
                  {s.value}
                  <span className="text-lg">{s.unit}</span>
                </p>
                <p className="text-text-muted text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Reaction distribution */}
          <div
            className="bg-surface rounded-[18px] p-5 space-y-4"
            style={{ border: "1px solid rgba(0,0,0,.07)" }}
          >
            <p className="text-xs text-text-muted font-bold">このグループの反応傾向</p>
            <StatBar
              label="😂 面白い"
              value={totalReactions ? (stats.reactionDist.funny / totalReactions) * 100 : 0}
              color="#E5402F"
            />
            <StatBar
              label="👏 うまい"
              value={totalReactions ? (stats.reactionDist.smart / totalReactions) * 100 : 0}
              color="#2BA35F"
            />
            <StatBar
              label="🤯 狂ってる"
              value={totalReactions ? (stats.reactionDist.crazy / totalReactions) * 100 : 0}
              color="#F0922B"
            />
          </div>

          {/* AI average scores */}
          {Object.keys(stats.avgAiScores).length > 0 && (
            <div
              className="bg-surface rounded-[18px] p-5 space-y-4"
              style={{ border: "1px solid rgba(0,0,0,.07)" }}
            >
              <p className="text-xs text-text-muted font-bold">AI審査員 平均点</p>
              {[
                { key: "王道", emoji: "👑", color: "#F4C422" },
                { key: "辛口", emoji: "🔪", color: "#E5402F" },
                { key: "カオス", emoji: "🌀", color: "#F0922B" },
              ].map(({ key, emoji, color }) => (
                <StatBar
                  key={key}
                  label={`${emoji} ${key}`}
                  value={stats.avgAiScores[key] ?? 0}
                  color={color}
                />
              ))}
              <p className="text-xs text-text-muted pt-2" style={{ borderTop: "1px solid #E4DCCF" }}>
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
            <div className="space-y-2.5">
              <p className="text-xs text-text-muted font-bold">殿堂入り回答 TOP5</p>
              {stats.topAnswers.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-surface rounded-[15px] px-4 py-3 animate-rise"
                  style={{ border: "1px solid rgba(0,0,0,.07)" }}
                >
                  <span className="font-display font-bold text-sm w-5 shrink-0" style={{ color: "#E5402F" }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-text text-sm font-bold leading-relaxed">{a.text}</p>
                    <p className="text-text-muted text-xs mt-0.5">座布団 {a.total}枚</p>
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
