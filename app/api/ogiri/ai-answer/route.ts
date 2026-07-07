import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const FALLBACK_ANSWERS = [
  "それ、AIに言われたくない",
  "存在するだけで面白い",
  "たぶん誰も気づかない",
  "地味だけど深い",
  "みんな薄々思ってた",
  "それを言っちゃあおしまいよ",
  "考えた末にこれでした",
];

function fallbackAnswers(count: number): string[] {
  const pool = [...FALLBACK_ANSWERS];
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0] ?? "回答できませんでした");
  }
  return picked;
}

async function generateAnswers(
  anthropic: Anthropic,
  question: string,
  count: number,
): Promise<string[]> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `あなたは大喜利の回答者になりきります。
お題: 「${question}」

人間が考えたように自然な回答を${count}個、それぞれ違う切り口で考えてください。
1つにつき40文字以内、下ネタ・差別的表現は禁止。
出力はJSON配列だけを返してください: ["回答1","回答2",...]`,
        },
      ],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return fallbackAnswers(count);
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return fallbackAnswers(count);
    const texts = parsed
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((v) => v.trim().slice(0, 40));
    if (texts.length < count) {
      return [...texts, ...fallbackAnswers(count - texts.length)];
    }
    return texts.slice(0, count);
  } catch {
    return fallbackAnswers(count);
  }
}

export async function POST(request: Request) {
  const idToken = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await getAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { sessionId, roundId, question, count } = await request.json() as {
    sessionId: string;
    roundId: string;
    question: string;
    count: 1 | 3;
  };

  if (!sessionId || !roundId || !question || (count !== 1 && count !== 3)) {
    return NextResponse.json({ error: "sessionId, roundId, question, count(1|3) required" }, { status: 400 });
  }

  const texts = process.env.ANTHROPIC_API_KEY
    ? await generateAnswers(new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }), question, count)
    : fallbackAnswers(count);

  const answersCol = adminDb
    .collection("sessions").doc(sessionId)
    .collection("rounds").doc(roundId)
    .collection("answers");

  const answerIds: string[] = [];
  await Promise.all(
    texts.map(async (text, i) => {
      const userId = count === 1 ? "ai" : `ai:${i}`;
      const ref = answersCol.doc();
      answerIds.push(ref.id);
      await ref.set({
        userId,
        displayOrder: Math.random(),
        text,
        submittedAt: FieldValue.serverTimestamp(),
      });
    })
  );

  return NextResponse.json({ ok: true, answerIds });
}
