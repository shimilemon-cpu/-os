"use client";

import Mascot from "@/components/Mascot";
import type { AnswerDoc, VoteDoc, Reaction } from "@/lib/types";

const REACTIONS: { key: Reaction; kind: "r_funny" | "r_smart" | "r_crazy"; label: string; color: string }[] = [
  { key: "funny", kind: "r_funny", label: "面白い", color: "#FFD600" },
  { key: "smart", kind: "r_smart", label: "うまい", color: "#00B4FF" },
  { key: "crazy", kind: "r_crazy", label: "狂ってる", color: "#BF5FFF" },
];

const LABELS = ["A", "B", "C", "D", "E"];

interface Props {
  answer: AnswerDoc;
  index: number;
  votes: VoteDoc[];
  myVote?: Reaction | null;
  canVote: boolean;
  isOwn: boolean;
  revealed?: boolean;
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
  const label = LABELS[index] ?? String(index + 1);

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 transition-all animate-rise ${
        isOwn
          ? "border-pop-yellow/40 bg-surface-2"
          : "border-line bg-surface"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold text-ink"
            style={{ backgroundColor: isOwn ? "#FFD600" : "#3f3f3f" }}
          >
            {label}
          </span>
          <span className="text-xs text-zinc-500">
            {revealed && authorNickname ? authorNickname : "回答" + label}
            {isOwn && " (あなた)"}
          </span>
        </div>
        {total > 0 && (
          <span className="text-xs text-zinc-500">{total}票</span>
        )}
      </div>

      {/* Answer text */}
      <p className="text-white text-base leading-relaxed font-medium">{answer.text}</p>

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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all active:scale-90 ${
                active
                  ? "border-transparent"
                  : "border-line bg-transparent"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              style={active ? { backgroundColor: r.color + "22", borderColor: r.color + "80" } : {}}
            >
              <Mascot kind={r.kind} size={18} className={active ? "animate-tap-pop" : ""} />
              {count > 0 && (
                <span
                  className="text-xs font-bold"
                  style={{ color: active ? r.color : "#737373" }}
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
