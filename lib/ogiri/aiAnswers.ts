import { auth } from "@/lib/firebase/client";

export async function generateAiAnswers(
  sessionId: string,
  roundId: string,
  question: string,
  count: 1 | 3,
): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch("/api/ogiri/ai-answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ sessionId, roundId, question, count }),
  });
  if (!res.ok) throw new Error("AI回答の生成に失敗しました");
}
