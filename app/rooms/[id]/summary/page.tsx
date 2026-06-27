"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import { tallyVotes } from "@/lib/ogiri/sessions";
import type { RoomDoc, AnswerDoc, VoteDoc } from "@/lib/types";
import { Share2, BarChart2 } from "lucide-react";

interface RoundSummary {
  round: number;
  question: string;
  mvp: { text: string; userId: string; total: number } | null;
}

export default function SummaryPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") ?? "";
  const router = useRouter();

  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [roundSummaries, setRoundSummaries] = useState<RoundSummary[]>([]);
  const [playerScores, setPlayerScores] = useState<{ userId: string; total: number }[]>([]);
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

          // Accumulate scores
          for (const a of answers) {
            scoreMap[a.userId] = (scoreMap[a.userId] ?? 0) + (tally[a.id]?.total ?? 0);
          }

          const sorted = [...answers].sort(
            (a, b) => (tally[b.id]?.total ?? 0) - (tally[a.id]?.total ?? 0)
          );
          const mvpAnswer = sorted[0];
          summaries.push({
            round: Number(roundDoc.id),
            question: roundData.question?.text ?? "",
            mvp: mvpAnswer
              ? {
                  text: mvpAnswer.text,
                  userId: mvpAnswer.userId,
                  total: tally[mvpAnswer.id]?.total ?? 0,
                }
              : null,
          });
        }

        summaries.sort((a, b) => a.round - b.round);
        setRoundSummaries(summaries);
        setPlayerScores(
          Object.entries(scoreMap)
            .map(([userId, total]) => ({ userId, total }))
            .sort((a, b) => b.total - a.total)
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  const champion = playerScores[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-12">
      <div className="text-center mb-8">
        <h1 className="serif text-[var(--accent)] text-3xl font-bold">最終結果</h1>
        <p className="text-[var(--muted)] text-sm mt-1">{room?.name}</p>
      </div>

      {/* Champion */}
      {champion && (
        <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/40 rounded-2xl p-5 mb-8 text-center space-y-2">
          <p className="text-4xl">🏆</p>
          <p className="text-[var(--gold)] text-lg font-bold">今日の優勝</p>
          <p className="text-[var(--text)] text-base">{champion.userId === uid ? "あなた！" : "チャンピオン"}</p>
          <p className="text-[var(--muted)] text-sm">{champion.total}票獲得</p>
        </div>
      )}

      {/* Score ranking */}
      <div className="space-y-2 mb-8">
        <p className="text-xs text-[var(--muted)] tracking-wide">スコアランキング</p>
        {playerScores.map((p, i) => (
          <div
            key={p.userId}
            className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
              p.userId === uid
                ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                : "border-[var(--border)] bg-[var(--surface)]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-[var(--muted)] text-sm w-5">{i + 1}</span>
              <span className="text-[var(--text)] text-sm">
                {p.userId === uid ? "あなた" : `Player ${i + 1}`}
              </span>
            </div>
            <span className="text-[var(--accent)] font-bold text-sm">{p.total}票</span>
          </div>
        ))}
      </div>

      {/* Round highlights */}
      <div className="space-y-3 mb-8">
        <p className="text-xs text-[var(--muted)] tracking-wide">各ラウンドのMVP</p>
        {roundSummaries.map((s) => (
          <div key={s.round} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 space-y-2">
            <p className="text-xs text-[var(--muted)]">Round {s.round}</p>
            <p className="text-[var(--muted)] text-xs">「{s.question}」</p>
            {s.mvp ? (
              <div>
                <p className="text-[var(--text)] text-sm">👑 {s.mvp.text}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{s.mvp.total}票</p>
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">データなし</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Link
          href={`/rooms/${roomId}/analysis?sid=${sessionId}`}
          className="flex items-center justify-center gap-2 w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm font-medium py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <BarChart2 size={16} />
          笑い分析を見る
        </Link>
        <button
          onClick={() => {
            const text = `大喜利Pocket ${room?.name ?? ""}\n🏆 ${champion?.total ?? 0}票でゲーム終了！\n#大喜利Pocket`;
            if (navigator.share) {
              navigator.share({ text });
            } else {
              navigator.clipboard.writeText(text);
            }
          }}
          className="flex items-center justify-center gap-2 w-full border border-[var(--accent)]/40 text-[var(--accent)] text-sm font-medium py-3.5 rounded-2xl active:scale-[0.98] transition-transform"
        >
          <Share2 size={16} />
          結果をシェア
        </button>
        <Link
          href="/rooms"
          className="block text-center text-[var(--muted)] text-sm py-2"
        >
          ルーム一覧に戻る
        </Link>
      </div>
    </div>
  );
}
