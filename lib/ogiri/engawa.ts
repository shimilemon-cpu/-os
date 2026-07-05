import {
  collection, doc, addDoc, setDoc, updateDoc, onSnapshot,
  Timestamp, query, orderBy, limit, increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { EngawaPostDoc, EngawaAnswerDoc, Genre, Difficulty } from "@/lib/types";

export async function publishToEngawa(
  sessionId: string,
  roundId: string,
  question: { text: string; genre: Genre; difficulty: Difficulty }
): Promise<string> {
  const id = `${sessionId}_${roundId}`;
  await setDoc(doc(db, "engawa", id), {
    question,
    publishedAt: Timestamp.now(),
    sessionId,
    roundId,
    answerCount: 0,
  } satisfies Omit<EngawaPostDoc, "id">, { merge: true });
  return id;
}

export function subscribeEngawa(cb: (posts: EngawaPostDoc[]) => void, max = 40) {
  const q = query(collection(db, "engawa"), orderBy("publishedAt", "desc"), limit(max));
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EngawaPostDoc)))
  );
}

export function subscribeEngawaPost(postId: string, cb: (post: EngawaPostDoc) => void) {
  if (!postId) return () => {};
  return onSnapshot(doc(db, "engawa", postId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as EngawaPostDoc);
  }, (err) => console.error("subscribeEngawaPost:", err));
}

export function subscribeEngawaAnswers(postId: string, cb: (answers: EngawaAnswerDoc[]) => void) {
  if (!postId) return () => {};
  const q = query(
    collection(db, "engawa", postId, "answers"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as EngawaAnswerDoc))),
    (err) => console.error("subscribeEngawaAnswers:", err)
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
