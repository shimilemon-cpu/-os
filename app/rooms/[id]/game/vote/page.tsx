"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import {
  subscribeAnswers, subscribeVotes, subscribeSession,
  subscribeRound, submitVote, transitionPhase,
  advanceAsyncRoundToReviewing, getTimestampMs,
} from "@/lib/ogiri/sessions";
import { subscribeRoom } from "@/lib/ogiri/rooms";
import type { SessionDoc, RoundDoc, AnswerDoc, VoteDoc, RoomDoc, Reaction } from "@/lib/types";

const VOTE_SECONDS = 45;

function ZabutonIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="10" viewBox="0 0 20 12" fill="none" aria-hidden="true">
      {filled ? (
        <>
          <rect x="1" y="3" width="18" height="8" rx="2" fill="#fff" opacity="0.9" />
          <rect x="3" y="1" width="14" height="4" rx="1.5" fill="rgba(255,255,255,.7)" />
        </>
      ) : (
        <>
          <rect x="1" y="3" width="18" height="8" rx="2" fill="#E5402F" opacity="0.8" />
          <rect x="3" y="1" width="14" height="4" rx="1.5" fill="#C54B3E" />
        </>
      )}
    </svg>
  );
}

function VoteTimer({ deadline, totalSeconds, onExpire }: { deadline: RoundDoc["voteDeadline"] | null; totalSeconds: number; onExpire?: () => void }) {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const dl = deadline as { toDate?: () => Date; seconds?: number };
    const end = typeof dl.toDate === "function" ? dl.toDate().getTime()
      : typeof dl.seconds === "number" ? dl.seconds * 1000 : 0;
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

function AsyncDeadlineBadge({ deadline }: { deadline: RoundDoc["voteDeadline"] | null }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const end = getTimestampMs(deadline as { toDate?: () => Date; seconds?: number } | null);
      if (!end) { setRemaining(""); return; }
      const diff = Math.max(0, end - Date.now());
      if (diff === 0) { setRemaining("期限切れ"); return; }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const mn = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(h > 0 ? `あと${h}時間${mn > 0 ? `${mn}分` : ""}` : `あと${mn}分`);
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!remaining) return null;
  return (
    <span
      className="font-gothic font-extrabold"
      style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, background: "#EBE2CF", color: "#7A6F5C" }}
    >
      {remaining}
    </span>
  );
}

function VotePageContent() {
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
  const votingRef = useRef(false);

  const isAsync = session?.mode === "async";

  useEffect(() => {
    const u1 = subscribeRoom(roomId, setRoom);
    const u2 = subscribeSession(sessionId, setSession);
    const u3 = subscribeRound(sessionId, roundParam, setRound);
    const u4 = subscribeAnswers(sessionId, roundParam, setAnswers);
    const u5 = subscribeVotes(sessionId, roundParam, setVotes);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [roomId, sessionId, roundParam]);

  // Navigation based on status changes
  useEffect(() => {
    if (!session) return;
    if (session.mode === "async") {
      if (session.status === "finished") {
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
      }
    } else {
      if (session.status === "reviewing") {
        router.replace(`/rooms/${roomId}/game/result?sid=${sessionId}&round=${roundParam}`);
      }
      if (session.status === "finished") {
        router.replace(`/rooms/${roomId}/summary?sid=${sessionId}`);
      }
    }
  }, [session, roomId, sessionId, roundParam, router]);

  // Async: navigate based on round status
  useEffect(() => {
    if (!round || !isAsync) return;
    if (round.status === "reviewing" || round.status === "done") {
      router.replace(`/rooms/${roomId}/game/result?sid=${sessionId}&round=${roundParam}`);
    }
  }, [round, isAsync, roomId, sessionId, roundParam, router]);

  const voteDeadline = (() => {
    const raw = round?.voteDeadline;
    if (!raw) return null;
    if (typeof (raw as { toDate?: unknown }).toDate === "function") return raw;
    return null;
  })();

  const advanceToResult = useCallback(async () => {
    if (!session || advancingRef.current) return;
    if (round?.status !== "voting") return;

    if (isAsync) {
      advancingRef.current = true;
      try {
        await advanceAsyncRoundToReviewing(sessionId, roundParam);
        const answerPayload = answers.map((a) => ({ id: a.id, text: a.text }));
        const token = await auth.currentUser?.getIdToken();
        fetch("/api/ogiri/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            sessionId, roundId: roundParam,
            question: round?.question.text ?? "",
            answers: answerPayload,
            judges: room?.judges ?? ["王道", "辛口"],
          }),
        }).catch((e) => console.error("AI review request failed:", e));
      } finally {
        advancingRef.current = false;
      }
      return;
    }

    // Realtime logic
    const isDeadlinePastNow = (() => {
      const dl = round.voteDeadline;
      if (!dl) return false;
      const tsObj = dl as { toDate?: () => Date; seconds?: number };
      const end = typeof tsObj.toDate === "function" ? tsObj.toDate().getTime()
        : typeof tsObj.seconds === "number" ? tsObj.seconds * 1000 : 0;
      return end > 0 && Date.now() >= end;
    })();
    if (!isHost && !isDeadlinePastNow) return;
    advancingRef.current = true;
    try {
      await transitionPhase(sessionId, roundParam,
        { status: "reviewing" },
        { status: "reviewing" },
      );
      const answerPayload = answers.map((a) => ({ id: a.id, text: a.text }));
      const token = await auth.currentUser?.getIdToken();
      fetch("/api/ogiri/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId, roundId: roundParam,
          question: round?.question.text ?? "",
          answers: answerPayload,
          judges: room?.judges ?? ["王道", "辛口"],
        }),
      }).catch((e) => console.error("AI review request failed:", e));
    } finally {
      advancingRef.current = false;
    }
  }, [session, isHost, round, sessionId, roundParam, answers, isAsync, room?.judges]);

  const handleVote = async (answerId: string, reaction: Reaction) => {
    if (votingRef.current) return;
    const alreadyVoted = votes.some((v) => v.voterId === uid);
    if (alreadyVoted) return;
    votingRef.current = true;
    try {
      await submitVote(sessionId, roundParam, answerId, uid, reaction);

      if (isAsync && room) {
        const newVoteCount = votes.length + 1;
        if (newVoteCount >= room.memberIds.length) {
          await advanceToResult();
        }
      } else if (isHost && session && room) {
        const totalExpected = (room.memberIds.length - 1) * answers.length;
        const myVotes = votes.filter((v) => v.voterId === uid).length + 1;
        if (myVotes >= answers.length - 1 && votes.length + 1 >= totalExpected) {
          await advanceToResult();
        }
      }
    } finally {
      votingRef.current = false;
    }
  };

  const myVotesMap: Record<string, Reaction> = {};
  for (const v of votes) {
    if (v.voterId === uid) myVotesMap[v.answerId] = v.reaction;
  }
  const myVotedId = Object.keys(myVotesMap)[0] ?? null;

  if (!session || !round || answers.length === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-paper">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[14px]">
        {isAsync && (
          <button
            onClick={() => router.push(`/rooms/${roomId}/game?sid=${sessionId}`)}
            className="font-gothic text-sub mb-1 flex items-center gap-1"
            style={{ fontSize: 11 }}
          >
            ← お題一覧に戻る
          </button>
        )}
        <div className="flex items-center gap-2 mb-1">
          <p className="font-gothic font-extrabold text-red" style={{ fontSize: 11 }}>投票中</p>
          {isAsync ? (
            <AsyncDeadlineBadge deadline={voteDeadline} />
          ) : (
            <VoteTimer deadline={voteDeadline} totalSeconds={VOTE_SECONDS} onExpire={advanceToResult} />
          )}
        </div>
        <p className="font-mincho font-bold text-[#1A1714]" style={{ fontSize: 17 }}>いちばん笑った回答に</p>
      </div>

      {/* お題カード（小） */}
      <div className="px-[20px] pb-[12px]">
        <div
          className="bg-white mb-[12px]"
          style={{ borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(0,0,0,.07)" }}
        >
          <p className="font-gothic font-extrabold text-sub mb-1" style={{ fontSize: 10 }}>お題</p>
          {round.question.imageUrl && (
            <div className="mb-2" style={{ borderRadius: 10, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={round.question.imageUrl} alt="お題の写真" className="w-full" style={{ maxHeight: 140, objectFit: "cover" }} />
            </div>
          )}
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 15, lineHeight: 1.4 }}>
            {round.question.text}
          </p>
        </div>
        <p className="font-gothic text-[#52493A]" style={{ fontSize: 13 }}>
          いちばん笑った回答に <span className="font-extrabold" style={{ color: "#E5402F", textDecoration: "underline", textDecorationColor: "rgba(229,64,47,.3)" }}>座布団</span> を１枚。
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
              <p className="font-gothic font-semibold text-[#1A1714]" style={{ fontSize: 17, lineHeight: 1.5, marginBottom: 14 }}>{a.text}</p>
              <div className="flex items-center justify-between">
                <span className="font-gothic text-sub" style={{ fontSize: 11 }}>回答 {String.fromCharCode(65 + i)}</span>
                {isOwn ? (
                  <span className="font-gothic text-sub2" style={{ fontSize: 12 }}>自分の回答</span>
                ) : isSelected ? (
                  <span
                    className="inline-flex items-center gap-[6px] font-gothic font-extrabold text-paper"
                    style={{ fontSize: 12, padding: "8px 18px", borderRadius: 999, background: "#E5402F" }}
                  >
                    <ZabutonIcon filled />座布団を渡した
                  </span>
                ) : (
                  <button
                    onClick={() => handleVote(a.id, "funny")}
                    disabled={myVotedId != null}
                    className="inline-flex items-center gap-[6px] font-gothic font-extrabold disabled:opacity-40 active:scale-95 transition-all"
                    style={{ fontSize: 12, padding: "8px 18px", borderRadius: 999, color: "#E5402F", background: "rgba(229,64,47,.08)", border: "1px solid rgba(229,64,47,.15)" }}
                  >
                    <ZabutonIcon />座布団
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-[20px] pb-[40px]"
        style={{ background: "linear-gradient(180deg,rgba(251,247,236,0),#FBF7EC 40%)" }}
      >
        {isAsync ? (
          myVotedId ? (
            <button
              onClick={() => router.push(`/rooms/${roomId}/game?sid=${sessionId}`)}
              className="w-full font-gothic font-bold text-sub active:scale-[0.98] transition-transform"
              style={{ fontSize: 14, padding: "16px 0", borderRadius: 18, border: "1px solid rgba(0,0,0,.1)" }}
            >
              ← お題一覧に戻る
            </button>
          ) : (
            <p className="text-center font-gothic text-sub py-4" style={{ fontSize: 13 }}>
              座布団を投げてください
            </p>
          )
        ) : (
          <button
            onClick={advanceToResult}
            disabled={!isHost}
            className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-all"
            style={{ fontSize: 18, padding: "16px 0", borderRadius: 18, background: "#1A1714" }}
          >
            投票を確定する
          </button>
        )}
      </div>
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    }>
      <VotePageContent />
    </Suspense>
  );
}
