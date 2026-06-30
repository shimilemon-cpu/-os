import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getQuestionFromBank, markQuestionUsed } from "@/lib/ogiri/questions";
import type { Genre, Difficulty } from "@/lib/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GENRES = ["日常", "恋愛", "仕事", "カオス", "その他"] as const;
const DIFFICULTIES = ["初級", "中級", "上級"] as const;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY未設定" }, { status: 500 });
  }

  const { genre, difficulty, groupStyle } = await request.json().catch(() => ({}));
  const g: Genre = GENRES.includes(genre) ? genre : GENRES[Math.floor(Math.random() * GENRES.length)];
  const d: Difficulty = DIFFICULTIES.includes(difficulty) ? difficulty : "中級";

  // Check question bank first
  try {
    const banked = await getQuestionFromBank(g, d);
    if (banked) {
      await markQuestionUsed(banked.id);
      return NextResponse.json({ question: banked.text, genre: banked.genre, difficulty: banked.difficulty });
    }
  } catch {
    // Bank unavailable — fall through to Claude generation
  }

  const styleHint = groupStyle
    ? `このグループの傾向: ${groupStyle}\nその傾向に合わせたお題を出してください。`
    : "";

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `あなたは大喜利の司会者です。
ジャンル: ${g}
難易度: ${d}（初級=誰でも答えやすい、中級=少し捻りが必要、上級=発想力が試される）
${styleHint}

日本語の大喜利お題を1つだけ生成してください。
- 「〇〇とは？」「〇〇な△△とは？」「〇〇のキャッチコピーを考えて」などの形式
- 回答しやすい長さ（1〜2文程度）
- 面白い回答が多様に生まれるお題
- お題だけを返す（説明不要）`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
  return NextResponse.json({ question: text, genre: g, difficulty: d });
}
