import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ tendency: "謎の存在", comment: "分析できませんでした" });
  }

  const { answers, nickname } = await request.json() as {
    answers: string[];
    nickname: string;
  };

  if (!answers || answers.length === 0) {
    return NextResponse.json({ tendency: "謎の存在", comment: "回答が少なすぎて分析できませんでした..." });
  }

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `あなたは大喜利の笑い傾向分析AIです。
プレイヤー「${nickname}」の回答パターンを分析して、笑いのスタイルを一言で診断してください。

回答一覧:
${answers.map((a, i) => `${i + 1}. 「${a}」`).join("\n")}

以下のJSONで返してください（日本語）:
{
  "tendency": "シュール系 / ボケ系 / 知性派 / ツッコミ系 / 天然系 / 変化球系 / 王道系 / 毒舌系 などの短いラベル（〜系で終わる）",
  "comment": "ちょっと●●な回答するね！のような20〜35文字の一言。フレンドリーに。"
}

JSONのみ返してください。`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ tendency: "謎の存在", comment: "分析できませんでした" });

  try {
    const parsed = JSON.parse(match[0]) as { tendency: string; comment: string };
    return NextResponse.json({
      tendency: String(parsed.tendency || "謎の存在"),
      comment: String(parsed.comment || "分析できませんでした"),
    });
  } catch {
    return NextResponse.json({ tendency: "謎の存在", comment: "分析できませんでした" });
  }
}
