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

const VOTE_SECONDS = 45;

function ZabutonIcon({ color }: { color: string }) {
  return (
    <svg width="15" height="13" viewBox="0 0 30 24" aria-hidden="true">
      <path d="M5 6h20l3 6-3 6H5L2 12z" fill={color}/>
    </svg>
  );
}

function VoteTimer({ deadline, totalSeconds, onExpire }: { deadline: RoundDoc["voteDeadline"] | null; totalSeconds: number; onExpire?: () => void }) {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const toDate = (deadline as { toDate?: () => Date }).toDate;
    const end = typeof toDate === "function" ? toDate().getTime() : 0;
    if (!end) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecs(remaining);
      if (remaining === 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  if (secs === null) return null;

  const color = secs > 20 ? "#E5402F" : secs > 10 ? "#F4C422" : "#E5402F";
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");

  return (
    <span className="font-mincho font-extrabold tabular-nums" style={{ fontSize: 14, color }}>
      {m}:{s}
    </span>
  );
}

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
    if (!session || advancingRef.current) return;
    if (round?.status !== "voting") return;
    // Allow any player to advance when the vote deadline has passed
    const isDeadlinePast = (() => {
      const dl = round.voteDeadline;
      if (!dl) return false;
      const toDate = (dl as { toDate?: () => Date }).toDate;
      const end = typeof toDate === "function" ? toDate().getTime() : 0;
      return end > 0 && Date.now() >= end;
    })();
    if (!isHost && !isDeadlinePast) return;
    advancingRef.current = true;
    try {
      await updateRound(sessionId, roundParam, { status: "reviewing" });
      await updateSession(sessionId, { status: "reviewing" });
      const answerPayload = answers.map((a) => ({ id: a.id, text: a.text }));
      fetch("/api/ogiri/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId, roundId: roundParam,
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
  const myVotedId = Object.keys(myVotesMap)[0] ?? null;

  if (!session || !round || answers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[14px]">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-gothic font-extrabold text-red" style={{ fontSize: 11 }}>投票中</p>
          <VoteTimer deadline={voteDeadline} totalSeconds={VOTE_SECONDS} onExpire={advanceToResult} />
        </div>
        <p className="font-mincho font-bold text-[#1A1714]" style={{ fontSize: 17 }}>いちばん笑った回答に</p>
      </div>

      {/* お題カード（小） */}
      <div
        className="mx-[20px] bg-white mb-[14px]"
        style={{ borderRadius: 16, padding: "13px 15px", border: "1px solid rgba(0,0,0,.07)" }}
      >
        <p className="font-gothic text-sub mb-1" style={{ fontSize: 11 }}>お題</p>
        <p className="font-mincho font-bold text-[#1A1714]" style={{ fontSize: 16, lineHeight: 1.4 }}>
          {round.question.text}
        </p>
        <p className="font-gothic font-bold text-[#52493A] mt-[12px]" style={{ fontSize: 12 }}>
          いちばん笑った回答に <span style={{ color: "#E5402F" }}>座布団</span> を１枚。
        </p>
      </div>

      {/* 回答リスト */}
      <div className="flex-1 px-[20px] pb-[14px] flex flex-col gap-[11px] overflow-y-auto">
        {answers.map((a, i) => {
          const isSelected = myVotesMap[a.id] != null;
          const isOwn = a.userId === uid;
          return (
            <div
              key={a.id}
              className="bg-white"
              style={{
                borderRadius: 18, padding: "15px 16px",
                border: isSelected ? "2px solid #E5402F" : "1px solid rgba(0,0,0,.07)",
              }}
            >
              <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 18, lineHeight: 1.5 }}>{a.text}</p>
              <div className="flex items-center justify-between mt-[12px]">
                <span className="font-gothic text-sub" style={{ fontSize: 11 }}>回答 {String.fromCharCode(65 + i)}</span>
                {isOwn ? (
                  <span className="font-gothic text-sub2" style={{ fontSize: 12 }}>自分の回答</span>
                ) : isSelected ? (
                  <span
                    className="inline-flex items-center gap-[7px] font-gothic font-extrabold text-paper"
                    style={{ fontSize: 13, padding: "8px 15px", borderRadius: 999, background: "#E5402F" }}
                  >
                    <ZabutonIcon color="#FBF7EC" />座布団を渡した
                  </span>
                ) : (
                  <button
                    onClick={() => handleVote(a.id, "funny")}
                    disabled={myVotedId != null}
                    className="inline-flex items-center gap-[7px] font-gothic font-extrabold disabled:opacity-40 active:scale-95 transition-all"
                    style={{ fontSize: 13, padding: "8px 15px", borderRadius: 999, color: "#E5402F", background: "#FCE7E3" }}
                  >
                    <ZabutonIcon color="#E5402F" />座布団
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-[20px] pb-[26px]"
        style={{ background: "linear-gradient(180deg,rgba(251,247,236,0),#FBF7EC 40%)" }}
      >
        <button
          onClick={advanceToResult}
          disabled={!isHost}
          className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-all"
          style={{ fontSize: 18, padding: "16px 0", borderRadius: 18, background: "#1A1714" }}
        >
          投票を確定する
        </button>
      </div>
    </div>
  );
}
