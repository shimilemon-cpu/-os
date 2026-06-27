import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const PERSONAS = [
  {
    key: "王道",
    desc: "王道的なセンスを評価するAI。わかりやすくて笑えるかを重視する。コメントは温かみがある。",
  },
  {
    key: "辛口",
    desc: "厳しい目線で評価するAI。甘えた回答には辛口コメント。ただし傑作には素直に高得点を出す。",
  },
  {
    key: "カオス",
    desc: "意味不明でシュールな回答を高評価するAI。普通の回答には低い点数。混沌を愛している。",
  },
] as const;

type Persona = (typeof PERSONAS)[number]["key"];

async function reviewAnswer(
  anthropic: Anthropic,
  question: string,
  answer: string,
  persona: Persona,
  personaDesc: string
): Promise<{ score: number; comment: string }> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `あなたは大喜利の審査員（${persona}）です。
${personaDesc}

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

  const { sessionId, roundId, question, answers } = await request.json() as {
    sessionId: string;
    roundId: string;
    question: string;
    answers: { id: string; text: string }[];
  };

  // Lazy-import Firebase to avoid build-time initialization
  const { doc, setDoc, Timestamp } = await import("firebase/firestore");
  const { db } = await import("@/lib/firebase/client");

  const tasks = answers.flatMap((answer) =>
    PERSONAS.map(async (persona) => {
      const result = await reviewAnswer(anthropic, question, answer.text, persona.key, persona.desc);
      const reviewRef = doc(
        db,
        "sessions", sessionId,
        "rounds", roundId,
        "aiReviews", `${answer.id}_${persona.key}`
      );
      await setDoc(reviewRef, {
        answerId: answer.id,
        persona: persona.key,
        score: result.score,
        comment: result.comment,
        createdAt: Timestamp.now(),
      });
    })
  );

  await Promise.all(tasks);
  return NextResponse.json({ ok: true });
}
