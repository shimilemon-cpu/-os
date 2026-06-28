import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const PERSONAS = {
  王道: `あなたはM-1グランプリやキングオブコントの審査員です。
プロの芸人目線で「間」「発想の転換」「わかりやすさ」「笑えるか」を総合評価します。
一般受けする笑いを重視し、誰もが「うまい！」と思える回答を高評価します。
コメントは熱量があり、良い点を具体的に指摘します。`,

  辛口: `あなたは厳しい目線を持つ大喜利の評論家です。
甘えた回答には低い点数と辛口コメントを出します。傑作には素直に高得点を出します。
【絶対ルール】下ネタ・性的表現・差別的内容を含む回答は即0点。コメントは「下ネタはNGです」のみ。
下ネタなしで面白さを追求することがこのゲームの真髄です。`,
} as const;

type PersonaKey = keyof typeof PERSONAS;

async function reviewAnswer(
  anthropic: Anthropic,
  question: string,
  answer: string,
  persona: PersonaKey,
): Promise<{ score: number; comment: string }> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `${PERSONAS[persona]}

お題: 「${question}」
回答: 「${answer}」

0〜100点のスコアと一言コメント（20〜40文字）をJSONで返してください。
{"score": 数字, "comment": "コメント"}`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return { score: 50, comment: "採点できませんでした" };
  try {
    const parsed = JSON.parse(match[0]) as { score: number; comment: string };
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
      comment: String(parsed.comment || ""),
    };
  } catch {
    return { score: 50, comment: "採点できませんでした" };
  }
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY未設定" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { sessionId, roundId, question, answers, judges } = await request.json() as {
    sessionId: string;
    roundId: string;
    question: string;
    answers: { id: string; text: string }[];
    judges?: string[];
  };

  const activePersonas = (Object.keys(PERSONAS) as PersonaKey[]).filter(
    (p) => !judges || judges.includes(p)
  );

  const tasks = answers.flatMap((answer) =>
    activePersonas.map(async (persona) => {
      const result = await reviewAnswer(anthropic, question, answer.text, persona);
      await adminDb
        .collection("sessions").doc(sessionId)
        .collection("rounds").doc(roundId)
        .collection("aiReviews").doc(`${answer.id}_${persona}`)
        .set({
          answerId: answer.id,
          persona,
          score: result.score,
          comment: result.comment,
          createdAt: FieldValue.serverTimestamp(),
        });
    })
  );

  await Promise.all(tasks);
  return NextResponse.json({ ok: true });
}
