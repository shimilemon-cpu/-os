import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  Timestamp, query, where, getDocs, orderBy, limit, setDoc, increment,
  writeBatch, deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { SessionDoc, RoundDoc, AnswerDoc, VoteDoc, AiReviewDoc, StampDoc, StampType, Reaction, GuessDoc } from "@/lib/types";

export async function createSession(
  roomId: string,
  totalRounds = 5,
  mode: "realtime" | "async" = "realtime",
  answererOrder?: string[],
): Promise<string> {
  const ref = await addDoc(collection(db, "sessions"), {
    roomId,
    currentRound: mode === "async" ? 0 : 1,
    totalRounds,
    status: "answering",
    mode,
    answerDeadline: null,
    voteDeadline: null,
    ...(answererOrder ? { answererOrder } : {}),
    createdAt: Timestamp.now(),
  } satisfies Omit<SessionDoc, "id">);
  return ref.id;
}

export async function getActiveSession(roomId: string): Promise<SessionDoc | null> {
  const q = query(
    collection(db, "sessions"),
    where("roomId", "==", roomId),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as SessionDoc;
}

export function subscribeSession(sessionId: string, cb: (s: SessionDoc) => void) {
  if (!sessionId) return () => {};
  return onSnapshot(doc(db, "sessions", sessionId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as SessionDoc);
  }, (err) => console.error("subscribeSession error:", err));
}

export async function updateSession(sessionId: string, data: Partial<Omit<SessionDoc, "id">>) {
  await updateDoc(doc(db, "sessions", sessionId), data);
}

export async function createRound(
  sessionId: string,
  round: number,
  question: RoundDoc["question"],
  answerSeconds: number,
  extra?: Partial<Pick<RoundDoc, "answererId">>,
): Promise<void> {
  const deadline = Timestamp.fromDate(new Date(Date.now() + answerSeconds * 1000));
  await setDoc(doc(db, "sessions", sessionId, "rounds", String(round)), {
    question,
    status: "answering",
    answerCount: 0,
    startedAt: Timestamp.now(),
    answerDeadline: deadline,
    voteDeadline: null,
    ...extra,
  } satisfies Omit<RoundDoc, "id">);
}

export function subscribeRound(sessionId: string, roundId: string, cb: (r: RoundDoc) => void) {
  if (!sessionId || !roundId) return () => {};
  return onSnapshot(doc(db, "sessions", sessionId, "rounds", roundId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as RoundDoc);
  }, (err) => console.error("subscribeRound error:", err));
}

export async function updateRound(sessionId: string, roundId: string, data: Partial<Omit<RoundDoc, "id">>) {
  await updateDoc(doc(db, "sessions", sessionId, "rounds", roundId), data);
}

export async function submitAnswer(
  sessionId: string,
  roundId: string,
  userId: string,
  text: string
): Promise<void> {
  const answersCol = collection(db, "sessions", sessionId, "rounds", roundId, "answers");
  const existing = await getDocs(query(answersCol, where("userId", "==", userId), limit(1)));
  if (!existing.empty) throw new Error("すでに回答済みです");

  const answerRef = doc(answersCol);
  const roundRef = doc(db, "sessions", sessionId, "rounds", roundId);
  const displayOrder = Math.random();
  const batch = writeBatch(db);
  batch.set(answerRef, {
    userId,
    displayOrder,
    text,
    submittedAt: Timestamp.now(),
  } satisfies Omit<AnswerDoc, "id">);
  batch.update(roundRef, { answerCount: increment(1) });
  await batch.commit();
}

export function subscribeAnswers(sessionId: string, roundId: string, cb: (a: AnswerDoc[]) => void) {
  if (!sessionId || !roundId) return () => {};
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds", roundId, "answers"),
    (snap) => {
      const answers = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as AnswerDoc))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      cb(answers);
    },
    (err) => console.error("subscribeAnswers error:", err)
  );
}

export async function submitVote(
  sessionId: string,
  roundId: string,
  answerId: string,
  voterId: string,
  reaction: Reaction
): Promise<void> {
  const voteRef = doc(collection(db, "sessions", sessionId, "rounds", roundId, "votes"));
  await setDoc(voteRef, {
    answerId,
    voterId,
    reaction,
    createdAt: Timestamp.now(),
  } satisfies Omit<VoteDoc, "id">);
}

export function subscribeVotes(sessionId: string, roundId: string, cb: (v: VoteDoc[]) => void) {
  if (!sessionId || !roundId) return () => {};
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds", roundId, "votes"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VoteDoc))),
    (err) => console.error("subscribeVotes error:", err)
  );
}

// ─── AI/人間当てクイズ ─────────────────────────────────────────

export async function submitGuess(
  sessionId: string,
  roundId: string,
  guessedAnswerId: string,
  voterId: string,
): Promise<void> {
  const guessRef = doc(collection(db, "sessions", sessionId, "rounds", roundId, "guesses"));
  await setDoc(guessRef, {
    guessedAnswerId,
    voterId,
    createdAt: Timestamp.now(),
  } satisfies Omit<GuessDoc, "id">);
}

export function subscribeGuesses(sessionId: string, roundId: string, cb: (g: GuessDoc[]) => void) {
  if (!sessionId || !roundId) return () => {};
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds", roundId, "guesses"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GuessDoc))),
    (err) => console.error("subscribeGuesses error:", err)
  );
}

// 正解の推測者を集計（重複投稿があってもvoterIdは重複排除する）
export function tallyGuesses(
  guesses: GuessDoc[],
  correctAnswerId: string | null,
): { correctVoterIds: string[]; correctCount: number } {
  if (!correctAnswerId) return { correctVoterIds: [], correctCount: 0 };
  const correctVoterIds = Array.from(
    new Set(
      guesses.filter((g) => g.guessedAnswerId === correctAnswerId).map((g) => g.voterId)
    )
  );
  return { correctVoterIds, correctCount: correctVoterIds.length };
}

export function subscribeAiReviews(
  sessionId: string,
  roundId: string,
  cb: (r: AiReviewDoc[]) => void
) {
  if (!sessionId || !roundId) return () => {};
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds", roundId, "aiReviews"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AiReviewDoc))),
    (err) => console.error("subscribeAiReviews error:", err)
  );
}

export async function transitionPhase(
  sessionId: string,
  roundId: string,
  roundData: Partial<Omit<RoundDoc, "id">>,
  sessionData: Partial<Omit<SessionDoc, "id">>,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "sessions", sessionId, "rounds", roundId), roundData);
  batch.update(doc(db, "sessions", sessionId), sessionData);
  await batch.commit();
}

// Tally votes per answer: returns { answerId -> { funny, smart, crazy, total } }
export function tallyVotes(votes: VoteDoc[]): Record<string, Record<Reaction | "total", number>> {
  const tally: Record<string, Record<Reaction | "total", number>> = {};
  for (const v of votes) {
    if (!tally[v.answerId]) tally[v.answerId] = { funny: 0, smart: 0, crazy: 0, total: 0 };
    tally[v.answerId][v.reaction]++;
    tally[v.answerId].total++;
  }
  return tally;
}

// ─── 非同期モード ──────────────────────────────────────────────

const ASYNC_DEADLINE_HOURS = 24;

export async function createAsyncRound(
  sessionId: string,
  round: number,
  question: RoundDoc["question"],
): Promise<void> {
  const deadline = Timestamp.fromDate(
    new Date(Date.now() + ASYNC_DEADLINE_HOURS * 60 * 60 * 1000),
  );
  await setDoc(doc(db, "sessions", sessionId, "rounds", String(round)), {
    question,
    status: "answering",
    answerCount: 0,
    startedAt: Timestamp.now(),
    answerDeadline: deadline,
    voteDeadline: null,
  } satisfies Omit<RoundDoc, "id">);
}

export function subscribeAllRounds(
  sessionId: string,
  cb: (rounds: RoundDoc[]) => void,
) {
  if (!sessionId) return () => {};
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds"),
    (snap) => {
      const rounds = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as RoundDoc)
        .sort((a, b) => Number(a.id) - Number(b.id));
      cb(rounds);
    },
    (err) => console.error("subscribeAllRounds error:", err),
  );
}

export async function getUserAnsweredRounds(
  sessionId: string,
  userId: string,
  totalRounds: number,
): Promise<Set<string>> {
  const answered = new Set<string>();
  await Promise.all(
    Array.from({ length: totalRounds }, async (_, i) => {
      const roundId = String(i + 1);
      const q = query(
        collection(db, "sessions", sessionId, "rounds", roundId, "answers"),
        where("userId", "==", userId),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) answered.add(roundId);
    }),
  );
  return answered;
}

export async function getUserVotedRounds(
  sessionId: string,
  userId: string,
  totalRounds: number,
): Promise<Set<string>> {
  const voted = new Set<string>();
  await Promise.all(
    Array.from({ length: totalRounds }, async (_, i) => {
      const roundId = String(i + 1);
      const q = query(
        collection(db, "sessions", sessionId, "rounds", roundId, "votes"),
        where("voterId", "==", userId),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) voted.add(roundId);
    }),
  );
  return voted;
}

export async function advanceAsyncRoundToVoting(
  sessionId: string,
  roundId: string,
): Promise<void> {
  const voteDeadline = Timestamp.fromDate(
    new Date(Date.now() + ASYNC_DEADLINE_HOURS * 60 * 60 * 1000),
  );
  await updateRound(sessionId, roundId, {
    status: "voting",
    voteDeadline,
  });
}

export async function advanceAsyncRoundToReviewing(
  sessionId: string,
  roundId: string,
): Promise<void> {
  await updateRound(sessionId, roundId, { status: "reviewing" });
}

export function getTimestampMs(
  ts: { toDate?: () => Date; seconds?: number } | null,
): number {
  if (!ts) return 0;
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  return 0;
}

export function isDeadlinePast(
  ts: { toDate?: () => Date; seconds?: number } | null,
): boolean {
  const ms = getTimestampMs(ts);
  return ms > 0 && Date.now() >= ms;
}

// ─── 感想スタンプ ──────────────────────────────────────────────

export async function toggleStamp(
  sessionId: string,
  roundId: string,
  answerId: string,
  userId: string,
  stamp: StampType,
): Promise<boolean> {
  const stampsCol = collection(db, "sessions", sessionId, "rounds", roundId, "stamps");
  const q = query(stampsCol, where("answerId", "==", answerId), where("userId", "==", userId), where("stamp", "==", stamp), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    await deleteDoc(snap.docs[0].ref);
    return false;
  }
  await addDoc(stampsCol, {
    answerId,
    userId,
    stamp,
    createdAt: Timestamp.now(),
  });
  return true;
}

export function subscribeStamps(
  sessionId: string,
  roundId: string,
  cb: (stamps: StampDoc[]) => void,
) {
  if (!sessionId || !roundId) return () => {};
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds", roundId, "stamps"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StampDoc)),
    (err) => console.error("subscribeStamps error:", err),
  );
}
