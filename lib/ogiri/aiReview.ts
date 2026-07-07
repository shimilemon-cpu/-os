import { auth } from "@/lib/firebase/client";

export async function triggerAiReview(
  sessionId: string,
  roundId: string,
  question: string,
  answers: { id: string; text: string }[],
  judges?: string[],
): Promise<void> {
  if (answers.length === 0) return;
  const token = await auth.currentUser?.getIdToken();
  await fetch("/api/ogiri/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ sessionId, roundId, question, answers, judges }),
  }).catch((e) => console.error("AI review request failed:", e));
}
