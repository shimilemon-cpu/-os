import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  Timestamp, query, where, getDocs, orderBy, limit, setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { SessionDoc, RoundDoc, AnswerDoc, VoteDoc, AiReviewDoc, Reaction } from "@/lib/types";

export async function createSession(roomId: string, totalRounds = 5): Promise<string> {
  const ref = await addDoc(collection(db, "sessions"), {
    roomId,
    currentRound: 1,
    totalRounds,
    status: "answering",
    answerDeadline: null,
    voteDeadline: null,
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
  return onSnapshot(doc(db, "sessions", sessionId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as SessionDoc);
  });
}

export async function updateSession(sessionId: string, data: Partial<Omit<SessionDoc, "id">>) {
  await updateDoc(doc(db, "sessions", sessionId), data);
}

export async function createRound(
  sessionId: string,
  round: number,
  question: RoundDoc["question"],
  answerSeconds: number
): Promise<void> {
  const deadline = Timestamp.fromDate(new Date(Date.now() + answerSeconds * 1000));
  await setDoc(doc(db, "sessions", sessionId, "rounds", String(round)), {
    question,
    status: "answering",
    answerCount: 0,
    startedAt: Timestamp.now(),
    answerDeadline: deadline,
    voteDeadline: null,
  } satisfies Omit<RoundDoc, "id">);
}

export function subscribeRound(sessionId: string, roundId: string, cb: (r: RoundDoc) => void) {
  return onSnapshot(doc(db, "sessions", sessionId, "rounds", roundId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as RoundDoc);
  });
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
  const answersSnap = await getDocs(
    collection(db, "sessions", sessionId, "rounds", roundId, "answers")
  );
  const answerRef = doc(collection(db, "sessions", sessionId, "rounds", roundId, "answers"));
  await setDoc(answerRef, {
    userId,
    displayOrder: answersSnap.size,
    text,
    submittedAt: Timestamp.now(),
  } satisfies Omit<AnswerDoc, "id">);
  await updateDoc(doc(db, "sessions", sessionId, "rounds", roundId), {
    answerCount: answersSnap.size + 1,
  });
}

export function subscribeAnswers(sessionId: string, roundId: string, cb: (a: AnswerDoc[]) => void) {
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds", roundId, "answers"),
    (snap) => {
      const answers = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as AnswerDoc))
        .sort((a, b) => a.displayOrder - b.displayOrder);
      cb(answers);
    }
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
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds", roundId, "votes"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VoteDoc)))
  );
}

export function subscribeAiReviews(
  sessionId: string,
  roundId: string,
  cb: (r: AiReviewDoc[]) => void
) {
  return onSnapshot(
    collection(db, "sessions", sessionId, "rounds", roundId, "aiReviews"),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AiReviewDoc)))
  );
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
