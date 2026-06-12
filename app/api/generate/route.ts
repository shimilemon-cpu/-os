import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
fal.config({ credentials: process.env.FAL_KEY });

const JAPAN_SCENE_SUFFIX = [
  "Showa-era Japan, tatami room, shoji screens, wooden Japanese architecture",
  "Japanese school uniform, Japanese countryside, rice paddies, furin wind chimes",
  "Japanese shotengai shopping arcade, old Japanese train station, retro neon signs",
  "sakura trees, Japanese coastal town, red torii gate, stone steps at a shrine",
];

async function generateScenes(memoryText: string, memoryYear: string, lifeStage: string): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `You are a cinematic art director specializing in nostalgic Japanese photography for a memory capsule app.

Generate exactly 4 image prompts based on this Japanese memory.

Memory: "${memoryText}"
Year: ${memoryYear}
Life stage: ${lifeStage}

Rules:
- Each prompt MUST feature unmistakably Japanese scenery (NOT Chinese, NOT Korean, NOT generic Asian)
- Use specific Japanese visual references: tatami, shoji, engawa, furin, matsuri, yakitori stall, JR train, school randoseru bag, kotatsu, Japanese apartment balcony, etc.
- Cinematic 35mm film photography aesthetic, warm faded tones, dust particles, golden hour or dusk light
- NO faces, NO people visible, NO text in image
- 1-2 sentences per prompt
- Each of the 4 prompts shows a DIFFERENT scene angle (close-up object, wide landscape, indoor detail, outdoor atmosphere)

Return ONLY a valid JSON array of 4 strings. No explanation.`,
    }],
  });
  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Invalid scene response");
  return JSON.parse(match[0]) as string[];
}

const NEGATIVE_PROMPT =
  "Chinese architecture, Chinese lanterns, Korean style, generic Asian, Southeast Asian, anime, illustration, painting, watercolor, 3D render, cartoon, people, faces, text, logo, signature";

async function generateImage(prompt: string, index: number): Promise<string> {
  const enhancedPrompt = `${prompt}, ${JAPAN_SCENE_SUFFIX[index % 4]}, 35mm film photography, Kodak Portra 400, nostalgic, cinematic, warm amber tones, Japan`;
  const falInput = {
    prompt: enhancedPrompt,
    negative_prompt: NEGATIVE_PROMPT,
    image_size: { width: 576, height: 1024 },
    num_inference_steps: 4,
    num_images: 1,
    enable_safety_checker: true,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await (fal.subscribe as any)("fal-ai/flux/schnell", {
    input: falInput,
  })) as { data: { images: { url: string }[] } };
  return result.data.images[0].url;
}

export async function POST(request: Request) {
  // 環境変数が未設定なら、原因がはっきり分かるエラーを返す
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が設定されていません（Vercelの環境変数を確認してください）" },
      { status: 500 }
    );
  }
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: "FAL_KEY が設定されていません（Vercelの環境変数を確認してください）" },
      { status: 500 }
    );
  }

  try {
    const { memoryText, memoryYear, lifeStage } = await request.json();
    const scenes = await generateScenes(memoryText, memoryYear, lifeStage);
    const images = await Promise.all(scenes.map((s, i) => generateImage(s, i)));
    return NextResponse.json({ images });
  } catch (e) {
    console.error("画像生成エラー:", e);
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
