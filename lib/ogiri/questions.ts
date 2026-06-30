import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { QuestionBankDoc, Genre, Difficulty } from "@/lib/types";

export async function getQuestionFromBank(genre?: Genre, difficulty?: Difficulty): Promise<QuestionBankDoc | null> {
  const col = adminDb.collection("questionBank");

  const tryQuery = async (q: FirebaseFirestore.Query) => {
    const snap = await q.limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() } as QuestionBankDoc;
  };

  if (genre) {
    const result = await tryQuery(
      col.where("usedAt", "==", null).where("genre", "==", genre).orderBy("createdAt", "asc")
    );
    if (result) return result;
  }

  return tryQuery(col.where("usedAt", "==", null).orderBy("createdAt", "asc"));
}

export async function markQuestionUsed(id: string): Promise<void> {
  await adminDb.doc(`questionBank/${id}`).update({ usedAt: FieldValue.serverTimestamp() });
}

export async function storeQuestion(
  text: string,
  genre: Genre,
  difficulty: Difficulty
): Promise<string> {
  const ref = await adminDb.collection("questionBank").add({
    text,
    genre,
    difficulty,
    usedAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}
