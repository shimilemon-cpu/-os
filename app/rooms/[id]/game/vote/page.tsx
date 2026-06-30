"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import {
  subscribeAnswers, subscribeVotes, subscribeSession,
  subscribeRound, submitVote, updateRound, updateSession,
} from "@/lib/ogiri/sessions";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import type { SessionDoc, RoundDoc, AnswerDoc, VoteDoc, RoomDoc, Reaction } from "@/lib/types";
import Timer from "@/components/ogiri/Timer";

const VOTE_SECONDS = 45;

export default function VotePage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sid") ?? "";
  const roundParam = searchParams.get("round") ?? "1";
  const router = useRouter();

  const [session, setSession] = useState<SessionDoc | null>(null);
  const [round, setRound] = useState<RoundDoc | null>(null);
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [answers, setAnswers] = useState<AnswerDoc[]>([]);
  const [votes, setVotes] = useState<VoteDoc[]>([]);
  const uid = auth.currentUser?.uid ?? "";
  const isHost = room?.hostId === uid;
  const advancingRef = useRef(false);

  useEffect(() => {
    const u1 = subscribeRoom(roomId, setRoom);
    const u2 = subscribeSession(sessionId, (s) => {
      setSession(s);
      if (s.status === "reviewing") {
        router.replace(`/rooms/${roomId}/game/result?sid=${sessionId}&round=${roundParam}`);
      }
      if (s.status === "finished") {
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
      }
    });
    const u3 = subscribeRound(sessionId, roundParam, setRound);
    const u4 = subscribeAnswers(sessionId, roundParam, setAnswers);
    const u5 = subscribeVotes(sessionId, roundParam, setVotes);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [roomId, sessionId, roundParam, router]);

  const voteDeadline = (() => {
    const raw = round?.voteDeadline;
    if (!raw) return null;
    if (typeof (raw as { toDate?: unknown }).toDate === "function") return raw;
    return null;
  })();

  const advanceToResult = useCallback(async () => {
    if (!session || !isHost || advancingRef.current) return;
    if (round?.status !== "voting") return;
    advancingRef.current = true;
    try {
      await updateRound(sessionId, roundParam, { status: "reviewing" });
      await updateSession(sessionId, { status: "reviewing" });
      const answerPayload = answers.map((a) => ({ id: a.id, text: a.text }));
      fetch("/api/ogiri/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          roundId: roundParam,
          question: round?.question.text ?? "",
          answers: answerPayload,
          judges: room?.judges ?? ["王道", "辛口"],
        }),
      }).catch(console.error);
    } finally {
      advancingRef.current = false;
    }
  }, [session, isHost, round, sessionId, roundParam, answers]);

  const handleVote = async (answerId: string, reaction: Reaction) => {
    const alreadyVoted = votes.some((v) => v.answerId === answerId && v.voterId === uid);
    if (alreadyVoted) return;
    await submitVote(sessionId, roundParam, answerId, uid, reaction);

    if (isHost && session && room) {
      const totalExpected = (room.memberIds.length - 1) * answers.length;
      const myVotes = votes.filter((v) => v.voterId === uid).length + 1;
      if (myVotes >= answers.length - 1 && votes.length + 1 >= totalExpected) {
        await advanceToResult();
      }
    }
  };

  const myVotesMap: Record<string, Reaction> = {};
  for (const v of votes) {
    if (v.voterId === uid) myVotesMap[v.answerId] = v.reaction;
  }

  if (!session || !round || answers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="w-8 h-8 rounded-full border-2 border-pop-red border-t-transparent animate-spin" />
      </div>
    );
  }

  const myVotedId = Object.keys(myVotesMap)[0] ?? null;

  return (
    <div className="min-h-screen flex flex-col px-5 pt-6 pb-8 bg-ink">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold tracking-wide" style={{ color: "#E5402F" }}>投票中</p>
            <Timer deadline={voteDeadline} totalSeconds={VOTE_SECONDS} onExpire={isHost ? advanceToResult : undefined} variant="text" />
          </div>
          <p className="font-display text-text text-lg font-bold">いちばん笑った回答に</p>
        </div>
      </div>

      {/* お題 */}
      <div className="bg-surface rounded-2xl px-4 py-3.5 mb-4" style={{ border: "1px solid rgba(0,0,0,.08)" }}>
        <p className="text-text-muted text-[11px] font-bold mb-1">お題</p>
        <p className="font-display text-text font-bold text-base leading-snug">{round.question.text}</p>
      </div>

      <p className="text-text-sub text-[12px] font-bold mb-3">
        いちばん笑った回答に <span style={{ color: "#E5402F" }}>座布団</span> を１枚。
      </p>

      {/* 回答一覧 */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {answers.map((a, i) => {
          const isSelected = myVotesMap[a.id] != null;
          const isOwn = a.userId === uid;
          return (
            <div
              key={a.id}
              className="bg-surface rounded-[18px] p-4"
              style={{ border: isSelected ? "2px solid #E5402F" : "1px solid rgba(0,0,0,.08)" }}
            >
              <p className="text-[18px] font-black leading-snug text-text mb-3">{a.text}</p>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-muted">回答 {String.fromCharCode(65 + i)}</span>
                {isOwn ? (
                  <span className="text-[12px] text-text-faint font-medium">自分の回答</span>
                ) : isSelected ? (
                  <span
                    className="inline-flex items-center gap-2 text-[13px] font-black text-[#FBF7EC] px-4 py-2 rounded-full"
                    style={{ background: "#E5402F" }}
                  >
                    <svg width="15" height="13" viewBox="0 0 30 24"><path d="M5 6h20l3 6-3 6H5L2 12z" fill="#FBF7EC"/></svg>
                    座布団を渡した
                  </span>
                ) : (
                  <button
                    onClick={() => handleVote(a.id, "funny")}
                    disabled={myVotedId != null}
                    className="inline-flex items-center gap-2 text-[13px] font-black px-4 py-2 rounded-full disabled:opacity-40 active:scale-95 transition-all"
                    style={{ color: "#E5402F", background: "#FCE7E3" }}
                  >
                    <svg width="15" height="13" viewBox="0 0 30 24"><path d="M5 6h20l3 6-3 6H5L2 12z" fill="#E5402F"/></svg>
                    座布団
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3" style={{ background: "linear-gradient(180deg,rgba(251,247,236,0),#FBF7EC 40%)" }}>
        <button
          onClick={advanceToResult}
          disabled={!isHost}
          className="w-full font-display font-bold py-4 rounded-2xl text-lg text-[#FBF7EC] disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{ background: "#1A1714" }}
        >
          投票を確定する
        </button>
      </div>
    </div>
  );
}
