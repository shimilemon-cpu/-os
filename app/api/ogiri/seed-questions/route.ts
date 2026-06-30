import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { storeQuestion } from "@/lib/ogiri/questions";
import type { Genre, Difficulty } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GENRES: Genre[] = ["日常", "恋愛", "仕事", "カオス", "その他"];
const DIFFICULTIES: Difficulty[] = ["初級", "中級", "上級"];

async function generateBatch(genre: Genre, difficulty: Difficulty, count: number): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `あなたは大喜利の司会者です。
ジャンル: ${genre}
難易度: ${difficulty}（初級=誰でも答えやすい、中級=少し捻りが必要、上級=発想力が試される）

日本語の大喜利お題を${count}つ生成してください。
- 「〇〇とは？」「〇〇な△△とは？」「〇〇のキャッチコピーを考えて」などの形式
- 回答しやすい長さ（1〜2文程度）
- 面白い回答が多様に生まれるお題
- お題だけを1行ずつ返す（番号や説明不要）`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  return text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0).slice(0, count);
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count = 30 } = await request.json().catch(() => ({}));
  const perCombo = Math.max(1, Math.ceil(count / (GENRES.length * DIFFICULTIES.length)));

  const jobs: Promise<void>[] = [];

  for (const genre of GENRES) {
    for (const difficulty of DIFFICULTIES) {
      jobs.push(
        generateBatch(genre, difficulty, perCombo).then((questions) =>
          Promise.all(questions.map((q) => storeQuestion(q, genre, difficulty)))
        ).then(() => undefined)
      );
    }
  }

  await Promise.all(jobs);
  return NextResponse.json({ ok: true, requested: count });
}
