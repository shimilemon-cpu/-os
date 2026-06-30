import {
  collection, doc, addDoc, updateDoc, onSnapshot,
  Timestamp, query, orderBy, limit, increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { EngawaPostDoc, EngawaAnswerDoc, Genre, Difficulty } from "@/lib/types";

export async function publishToEngawa(
  sessionId: string,
  roundId: string,
  question: { text: string; genre: Genre; difficulty: Difficulty }
): Promise<string> {
  const ref = await addDoc(collection(db, "engawa"), {
    question,
    publishedAt: Timestamp.now(),
    sessionId,
    roundId,
    answerCount: 0,
  } satisfies Omit<EngawaPostDoc, "id">);
  return ref.id;
}

export function subscribeEngawa(cb: (posts: EngawaPostDoc[]) => void, max = 40) {
  const q = query(collection(db, "engawa"), orderBy("publishedAt", "desc"), limit(max));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EngawaPostDoc)))
  );
}

export function subscribeEngawaPost(postId: string, cb: (post: EngawaPostDoc) => void) {
  return onSnapshot(doc(db, "engawa", postId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as EngawaPostDoc);
  });
}

export function subscribeEngawaAnswers(postId: string, cb: (answers: EngawaAnswerDoc[]) => void) {
  const q = query(
    collection(db, "engawa", postId, "answers"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EngawaAnswerDoc)))
  );
}

export async function addEngawaAnswer(
  postId: string,
  text: string,
  userId: string | null
): Promise<void> {
  await addDoc(collection(db, "engawa", postId, "answers"), {
    text,
    userId,
    createdAt: Timestamp.now(),
  } satisfies Omit<EngawaAnswerDoc, "id">);
  await updateDoc(doc(db, "engawa", postId), { answerCount: increment(1) });
}
