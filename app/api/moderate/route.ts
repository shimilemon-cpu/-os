import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// AIを呼ぶ前の高速フィルタ。露骨な語が含まれていれば即ブロックする。
const HARD_BLOCK =
  /(セックス|セフレ|フェラ|オナニー|射精|挿入|童貞|処女|чмо|ちんこ|ちんちん|まんこ|おっぱい|乳首|ヤリ(まん|チン)|風俗|デリヘル|ソープ|AV女優|エロ|ポルノ|レイプ|強姦|痴漢|盗撮|売春|殺すぞ|死ね|きもい死|fuck|pussy|dick|cunt|porn|n[i1]gger)/i;

interface ModerationResult {
  allowed: boolean;
  category: string;
  reason: string;
}

async function classifyWithAI(text: string): Promise<ModerationResult> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `あなたは「思い出を綴る」健全なアプリの投稿モデレーターです。次の投稿テキストが公開して問題ないか判定してください。

投稿テキスト:
"""
${text}
"""

以下のいずれかに該当する場合は不許可（allowed=false）にしてください:
- 性的・下ネタ・わいせつな内容
- 暴力・残虐・自傷や死を扇動する内容
- 差別・ヘイト・侮辱・誹謗中傷
- 個人情報（電話番号・住所・フルネームの晒し等）
- 宣伝・スパム・外部サイトへの誘導
- 明らかな悪意のあるいたずら

ノスタルジックな思い出・恋愛の切なさ・別れ・死別など、健全で情緒的な内容は許可してください。

次のJSONのみを返してください（説明不要）:
{"allowed": true/false, "category": "ok|sexual|violence|hate|privacy|spam|other", "reason": "日本語で短く理由"}`,
      },
    ],
  });
  const raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    // 解析に失敗したら安全側に倒して許可（ハードフィルタは通過済み）
    return { allowed: true, category: "ok", reason: "" };
  }
  return JSON.parse(match[0]) as ModerationResult;
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const value = typeof text === "string" ? text.trim() : "";
    if (!value) {
      return NextResponse.json({ allowed: true, category: "ok", reason: "" });
    }

    // 1. ハードフィルタ
    if (HARD_BLOCK.test(value)) {
      return NextResponse.json({
        allowed: false,
        category: "sexual",
        reason: "不適切な表現が含まれています",
      });
    }

    // 2. APIキーが無ければハードフィルタのみで通す
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ allowed: true, category: "ok", reason: "" });
    }

    // 3. AI判定
    const result = await classifyWithAI(value);
    return NextResponse.json(result);
  } catch (e) {
    console.error("モデレーションエラー:", e);
    // 判定処理が落ちた場合は投稿をブロックせず通す（誤検知で締め出さない）
    return NextResponse.json({ allowed: true, category: "ok", reason: "" });
  }
}
