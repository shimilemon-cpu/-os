"use client";

import type { AnswerDoc, VoteDoc, Reaction } from "@/lib/types";

const REACTIONS: { key: Reaction; emoji: string; label: string; color: string }[] = [
  { key: "funny", emoji: "😂", label: "面白い", color: "var(--gold)" },
  { key: "smart", emoji: "🧠", label: "うまい", color: "#60a5fa" },
  { key: "crazy", emoji: "🤯", label: "狂ってる", color: "#c084fc" },
];

interface Props {
  answer: AnswerDoc;
  index: number;
  votes: VoteDoc[];
  myVote?: Reaction | null;
  canVote: boolean;
  isOwn: boolean;
  revealed?: boolean; // true = show userId after game
  authorNickname?: string;
  onVote?: (answerId: string, reaction: Reaction) => void;
}

export default function AnswerCard({
  answer,
  index,
  votes,
  myVote,
  canVote,
  isOwn,
  revealed,
  authorNickname,
  onVote,
}: Props) {
  const tally = REACTIONS.reduce(
    (acc, r) => {
      acc[r.key] = votes.filter((v) => v.answerId === answer.id && v.reaction === r.key).length;
      return acc;
    },
    {} as Record<Reaction, number>
  );
  const total = Object.values(tally).reduce((s, n) => s + n, 0);

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 transition-all ${
        isOwn
          ? "border-[var(--accent)]/40 bg-[var(--surface-2)]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--muted)]">
          {revealed && authorNickname ? authorNickname : `回答 ${String.fromCharCode(64 + index + 1)}`}
          {isOwn && " (あなた)"}
        </span>
        {total > 0 && (
          <span className="text-xs text-[var(--muted)]">{total}票</span>
        )}
      </div>

      {/* Answer text */}
      <p className="text-[var(--text)] text-base leading-relaxed">{answer.text}</p>

      {/* Reactions */}
      <div className="flex gap-2">
        {REACTIONS.map((r) => {
          const active = myVote === r.key;
          const count = tally[r.key];
          return (
            <button
              key={r.key}
              disabled={!canVote || isOwn}
              onClick={() => onVote?.(answer.id, r.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-all ${
                active
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--border)] bg-transparent"
              } ${canVote && !isOwn ? "hover:border-[var(--accent)]/60 active:scale-95" : ""} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span>{r.emoji}</span>
              {count > 0 && (
                <span
                  className="text-xs font-medium"
                  style={{ color: active ? "var(--accent)" : r.color }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
