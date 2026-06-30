"use client";

import type { AnswerDoc, VoteDoc, Reaction } from "@/lib/types";

const REACTIONS: { key: Reaction; emoji: string; label: string; color: string; bg: string }[] = [
  { key: "funny",  emoji: "😂", label: "面白い",   color: "#E5402F", bg: "#FCE7E3" },
  { key: "smart",  emoji: "👏", label: "うまい",   color: "#2BA35F", bg: "#E6F5EC" },
  { key: "crazy",  emoji: "🤯", label: "狂ってる", color: "#F0922B", bg: "#FEF0E3" },
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
      className="rounded-[18px] p-4 space-y-3 animate-rise"
      style={{
        background: isOwn ? "#EBE2CF" : "#ffffff",
        border: isOwn ? "1.5px solid #E0A93B" : "1px solid rgba(0,0,0,.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-bold"
            style={{
              background: isOwn ? "#E0A93B" : "#1A1714",
              color: "#FBF7EC",
            }}
          >
            {label}
          </span>
          <span className="text-xs text-text-muted">
            {revealed && authorNickname ? authorNickname : "回答" + label}
            {isOwn && "（あなた）"}
          </span>
        </div>
        {total > 0 && (
          <span className="text-xs text-text-muted">{total}票</span>
        )}
      </div>

      {/* Answer text */}
      <p className="text-text text-[18px] font-black leading-snug">{answer.text}</p>

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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: active ? r.bg : "rgba(0,0,0,.05)",
                color: active ? r.color : "#7A6F5C",
                border: active ? `1.5px solid ${r.color}40` : "1.5px solid transparent",
              }}
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
              {count > 0 && (
                <span className="font-bold">{count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
