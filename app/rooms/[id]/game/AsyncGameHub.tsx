"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  subscribeAllRounds,
  getUserAnsweredRounds,
  getUserVotedRounds,
  advanceAsyncRoundToVoting,
  advanceAsyncRoundToReviewing,
  updateSession,
  getTimestampMs,
  isDeadlinePast,
} from "@/lib/ogiri/sessions";
import { finishGame } from "@/lib/ogiri/rooms";
import type { SessionDoc, RoundDoc, RoomDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";

type RoundAction = "answer" | "answered" | "vote" | "voted" | "result" | "waiting";

const GENRE_COLORS: Record<string, string> = {
  日常: "#2BA35F", 恋愛: "#E5402F", 仕事: "#5BA9D6",
  カオス: "#F4C422", その他: "#B6AC97",
  定番: "#E5402F", あるある: "#2BA35F", "写真で一言": "#5BA9D6", ブラック: "#1A1714",
};

function formatRemaining(deadlineTs: RoundDoc["answerDeadline"]): string {
  const end = getTimestampMs(
    deadlineTs as { toDate?: () => Date; seconds?: number } | null,
  );
  if (!end) return "";
  const remaining = Math.max(0, end - Date.now());
  if (remaining === 0) return "期限切れ";
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `あと${hours}時間${mins > 0 ? `${mins}分` : ""}`;
  if (mins > 0) return `あと${mins}分`;
  return "まもなく期限";
}

function getRoundAction(
  round: RoundDoc,
  answered: boolean,
  voted: boolean,
): RoundAction {
  if (round.status === "done" || round.status === "reviewing") return "result";
  if (round.status === "voting") return voted ? "voted" : "vote";
  // answering
  if (answered) return "answered";
  return "answer";
}

const ACTION_CONFIG: Record<RoundAction, {
  label: string; bg: string; color: string; border?: string;
}> = {
  answer:   { label: "回答する",   bg: "#2BA35F", color: "#fff" },
  answered: { label: "回答済み ✓", bg: "#E6F5EC", color: "#2BA35F", border: "1px solid #2BA35F" },
  vote:     { label: "投票する",   bg: "#E5402F", color: "#fff" },
  voted:    { label: "投票済み ✓", bg: "#FCE7E3", color: "#E5402F", border: "1px solid #E5402F" },
  result:   { label: "結果を見る", bg: "#F4C422", color: "#1A1714" },
  waiting:  { label: "準備中…",   bg: "#EBE2CF", color: "#7A6F5C" },
};

function RoundCard({
  round,
  index,
  action,
  memberCount,
  isHost,
  closing,
  onTap,
  onClose,
}: {
  round: RoundDoc;
  index: number;
  action: RoundAction;
  memberCount: number;
  isHost: boolean;
  closing: boolean;
  onTap: () => void;
  onClose?: () => void;
}) {
  const cfg = ACTION_CONFIG[action];
  const genreColor = GENRE_COLORS[round.question.genre] ?? "#B6AC97";
  const deadline =
    round.status === "voting" ? round.voteDeadline : round.answerDeadline;
  const remaining = formatRemaining(deadline);
  const isActionable = action === "answer" || action === "vote" || action === "result";

  return (
    <div
      style={{
        borderRadius: 18,
        padding: "16px 16px 14px",
        background: "#fff",
        border: isActionable
          ? `1.5px solid ${cfg.bg}`
          : "1px solid rgba(0,0,0,.07)",
        boxShadow: isActionable
          ? `0 4px 14px -6px ${cfg.bg}40`
          : "0 2px 8px rgba(40,30,10,.04)",
      }}
      onClick={action !== "waiting" ? onTap : undefined}
      className={`w-full text-left ${action !== "waiting" ? "active:scale-[0.98] cursor-pointer" : ""} transition-transform`}
    >
      <div className="flex items-center gap-[10px] mb-[10px]">
        <span
          className="font-gothic font-extrabold"
          style={{
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 999,
            color: "#E5402F",
            background: "#FCE7E3",
          }}
        >
          第{index + 1}問
        </span>
        <span
          className="font-gothic font-extrabold"
          style={{
            fontSize: 10,
            padding: "2px 7px",
            borderRadius: 999,
            color: genreColor,
            background: `${genreColor}15`,
          }}
        >
          {round.question.genre}
        </span>
        {remaining && (
          <span className="font-gothic text-sub ml-auto" style={{ fontSize: 10 }}>
            {remaining}
          </span>
        )}
      </div>

      <p
        className="font-mincho font-extrabold text-[#1A1714] mb-[12px]"
        style={{ fontSize: 15, lineHeight: 1.5 }}
      >
        {round.question.text}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[6px]">
          <div className="flex" style={{ gap: 2 }}>
            {Array.from({ length: round.answerCount }).map((_, i) => (
              <div
                key={`d-${i}`}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background:
                    round.status === "answering" ? "#2BA35F" : "#7A6F5C",
                }}
              />
            ))}
            {round.status === "answering" &&
              Array.from({ length: Math.max(0, memberCount - round.answerCount) }).map(
                (_, i) => (
                  <div
                    key={`p-${i}`}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#E0DDD4",
                    }}
                  />
                ),
              )}
          </div>
          <span className="font-gothic text-sub" style={{ fontSize: 10 }}>
            {round.status === "answering"
              ? `${round.answerCount}/${memberCount}人 回答済み`
              : round.status === "voting"
                ? "投票受付中"
                : "完了"}
          </span>
        </div>

        <span
          className="font-gothic font-extrabold"
          style={{
            fontSize: 11,
            padding: "6px 14px",
            borderRadius: 999,
            background: cfg.bg,
            color: cfg.color,
            border: cfg.border ?? "none",
          }}
        >
          {cfg.label}
        </span>
      </div>

      {isHost && round.status === "answering" && round.answerCount > 0 && onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          disabled={closing}
          className="w-full mt-[10px] font-gothic font-extrabold active:scale-[0.98] transition-transform disabled:opacity-50"
          style={{
            fontSize: 12,
            padding: "10px 0",
            borderRadius: 12,
            background: closing ? "#EBE2CF" : "#1A1714",
            color: closing ? "#7A6F5C" : "#FBF7EC",
          }}
        >
          {closing ? "AI審査中…" : `回答を締め切る（${round.answerCount}件）`}
        </button>
      )}
    </div>
  );
}

export default function AsyncGameHub({
  roomId,
  session,
  room,
  sessionId,
}: {
  roomId: string;
  session: SessionDoc;
  room: RoomDoc;
  sessionId: string;
}) {
  const router = useRouter();
  const [rounds, setRounds] = useState<RoundDoc[]>([]);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [closingRound, setClosingRound] = useState<string | null>(null);
  const uid = auth.currentUser?.uid ?? "";
  const isHost = room.hostId === uid;
  const checkedRef = useRef(false);
  const finishingRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeAllRounds(sessionId, setRounds);
    return unsub;
  }, [sessionId]);

  useEffect(() => {
    if (!uid || !session.totalRounds) return;
    Promise.all([
      getUserAnsweredRounds(sessionId, uid, session.totalRounds),
      getUserVotedRounds(sessionId, uid, session.totalRounds),
    ]).then(([a, v]) => {
      setAnswered(a);
      setVoted(v);
      setLoading(false);
    });
  }, [sessionId, uid, session.totalRounds, rounds]);

  // Check deadlines and auto-advance rounds
  const checkDeadlines = useCallback(async () => {
    if (checkedRef.current) return;
    checkedRef.current = true;
    try {
      for (const r of rounds) {
        if (
          r.status === "answering" &&
          isDeadlinePast(
            r.answerDeadline as { toDate?: () => Date; seconds?: number },
          )
        ) {
          await advanceAsyncRoundToVoting(sessionId, r.id);
        }
        if (
          r.status === "voting" &&
          isDeadlinePast(
            r.voteDeadline as { toDate?: () => Date; seconds?: number },
          )
        ) {
          await advanceAsyncRoundToReviewing(sessionId, r.id);
        }
      }
    } finally {
      checkedRef.current = false;
    }
  }, [rounds, sessionId]);

  useEffect(() => {
    if (rounds.length === 0) return;
    checkDeadlines();
  }, [rounds, checkDeadlines]);

  // Check if all rounds are done → finish session
  useEffect(() => {
    if (rounds.length === 0 || rounds.length < session.totalRounds) return;
    if (finishingRef.current) return;
    const allDone = rounds.every((r) => r.status === "done");
    if (!allDone) return;
    finishingRef.current = true;
    updateSession(sessionId, { status: "finished" })
      .then(() => finishGame(roomId))
      .then(() =>
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`),
      )
      .catch(console.error);
  }, [rounds, session.totalRounds, sessionId, roomId, router]);

  const handleCloseRound = useCallback(async (round: RoundDoc) => {
    if (closingRound) return;
    setClosingRound(round.id);
    try {
      await advanceAsyncRoundToReviewing(sessionId, round.id);

      const answersSnap = await getDocs(
        collection(db, "sessions", sessionId, "rounds", round.id, "answers"),
      );
      const answerList = answersSnap.docs.map((d) => ({
        id: d.id,
        text: (d.data() as { text: string }).text,
      }));

      if (answerList.length > 0) {
        const token = await auth.currentUser?.getIdToken();
        fetch("/api/ogiri/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            sessionId,
            roundId: round.id,
            question: round.question.text,
            answers: answerList,
          }),
        }).catch(console.error);
      }

      router.push(
        `/rooms/${roomId}/game/result?sid=${sessionId}&round=${round.id}`,
      );
    } catch (e) {
      console.error("Close round failed:", e);
    } finally {
      setClosingRound(null);
    }
  }, [closingRound, sessionId, roomId, router]);

  const handleTap = (round: RoundDoc, action: RoundAction) => {
    if (action === "answer") {
      router.push(
        `/rooms/${roomId}/game?sid=${sessionId}&round=${round.id}`,
      );
    } else if (action === "vote") {
      router.push(
        `/rooms/${roomId}/game/vote?sid=${sessionId}&round=${round.id}`,
      );
    } else if (action === "result") {
      router.push(
        `/rooms/${roomId}/game/result?sid=${sessionId}&round=${round.id}`,
      );
    } else if (action === "answered") {
      router.push(
        `/rooms/${roomId}/game?sid=${sessionId}&round=${round.id}`,
      );
    } else if (action === "voted") {
      router.push(
        `/rooms/${roomId}/game/vote?sid=${sessionId}&round=${round.id}`,
      );
    }
  };

  const actionableCount = rounds.filter((r) => {
    const a = getRoundAction(r, answered.has(r.id), voted.has(r.id));
    return a === "answer" || a === "vote";
  }).length;

  if (loading && rounds.length === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-paper pb-[100px]">
      {/* Header */}
      <div className="px-[20px] pt-[10px] pb-[14px]">
        <div className="flex items-center gap-[8px] mb-1">
          <button
            onClick={() => router.push("/rooms")}
            className="grid place-items-center bg-white"
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              border: "1px solid rgba(0,0,0,.07)",
              flexShrink: 0,
            }}
            aria-label="戻る"
          >
            <Icon name="back" size={18} color="#1A1714" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-[6px]">
              <span
                className="font-gothic font-extrabold"
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "#EBE2CF",
                  color: "#7A6F5C",
                }}
              >
                ⏰ 非同期
              </span>
              <span className="font-gothic text-sub" style={{ fontSize: 10 }}>
                {room.memberIds.length}人参加中
              </span>
            </div>
            <p
              className="font-mincho font-extrabold text-[#1A1714]"
              style={{ fontSize: 20 }}
            >
              {room.name}
            </p>
          </div>
          <Engimono
            name="cat"
            width={40}
            height={44}
            style={{ opacity: 0.9 }}
          />
        </div>
      </div>

      {/* Status banner */}
      {actionableCount > 0 && (
        <div
          className="mx-[20px] mb-[14px]"
          style={{
            borderRadius: 14,
            padding: "12px 16px",
            background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)",
            border: "1.5px dashed #E0A93B",
          }}
        >
          <p
            className="font-gothic font-extrabold text-center"
            style={{ fontSize: 13, color: "#9A6410" }}
          >
            あなたの番です！{actionableCount}件のアクションがあります
          </p>
        </div>
      )}

      {/* Round list */}
      <div className="flex-1 px-[20px] flex flex-col gap-[10px]">
        <p
          className="font-gothic font-extrabold text-sub"
          style={{ fontSize: 12 }}
        >
          お題一覧（全{session.totalRounds}問）
        </p>
        {rounds.map((round, i) => {
          const action = getRoundAction(
            round,
            answered.has(round.id),
            voted.has(round.id),
          );
          return (
            <RoundCard
              key={round.id}
              round={round}
              index={i}
              action={action}
              memberCount={room.memberIds.length}
              isHost={isHost}
              closing={closingRound === round.id}
              onTap={() => handleTap(round, action)}
              onClose={() => handleCloseRound(round)}
            />
          );
        })}
      </div>
    </div>
  );
}
