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

function eraStyle(year: number): string {
  if (year < 1990)
    return "Super 8 film grain, faded Kodak Ektachrome slide film, warm amber vintage tones, Showa analog haze, heavily aged";
  if (year < 2000)
    return "Fujifilm disposable camera, 90s film grain, slightly faded saturated Heisei colors, soft vignette";
  if (year < 2010)
    return "early 2000s digital compact camera, Canon PowerShot, crisp slightly warm colors, mild Y2K softness";
  return "contemporary natural light photography, sharp vivid colors, VSCO C1 preset, modern Japan, clean bright tones";
}

function moodStyle(mood: string): string {
  if (mood === "bright")
    return "bright sunny daylight, vivid saturated colors, wide open cheerful space, joyful warm golden light, uplifting atmosphere";
  if (mood === "muted")
    return "overcast diffused light, desaturated muted palette, quiet stillness, soft cool shadows, melancholy tone";
  return "golden hour warm light, gentle nostalgic atmosphere, soft amber glow";
}

async function generateScenes(
  memoryText: string,
  memoryYear: string,
  lifeStage: string,
  userRegion: string,
): Promise<{ mood: string; scenes: string[] }> {
  const regionBlock = userRegion
    ? `\nUser's hometown visual context (use as default backdrop): ${userRegion}`
    : "";

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 750,
    messages: [
      {
        role: "user",
        content: `You are a cinematic art director for a Japanese memory capsule app.

Analyze this Japanese memory and generate 4 image prompts.

Memory: "${memoryText}"
Year: ${memoryYear}
Life stage: ${lifeStage}${regionBlock}

Step 1 — Detect the emotional tone of this memory:
- "bright": joyful, fun, exciting, happy, carefree, celebratory
- "muted": sad, grief, lonely, anxious, struggling, bittersweet
- "warm": nostalgic but positive, bittersweet fondness, gentle yearning

Step 2 — Generate 4 scene prompts:
- Each MUST feature unmistakably Japanese scenery (NOT Chinese, NOT Korean, NOT generic Asian)
- LOCATION PRIORITY: If the memory text explicitly mentions a specific place or scenery (e.g. 海, 山, 渋谷, 田んぼ, 実家, 海岸, 駅, 公園), use that as the setting. Otherwise, draw from the user's hometown context above.
- Use specific Japanese visual references appropriate to the setting: tatami, shoji, engawa, furin, matsuri, yakitori stall, JR train, school randoseru bag, kotatsu, fishing port, rice paddy canal, apartment balcony, etc.
- NO faces, NO people visible, NO text in image
- 1-2 sentences per prompt
- 4 different angles: close-up object, wide landscape, indoor detail, outdoor atmosphere

Return ONLY valid JSON (no explanation):
{"mood":"bright|warm|muted","scenes":["...","...","...","..."]}`,
      },
    ],
  });
  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Invalid scene response");
  const parsed = JSON.parse(match[0]) as { mood: string; scenes: string[] };
  if (!Array.isArray(parsed.scenes) || parsed.scenes.length < 4)
    throw new Error("Invalid scenes array");
  return parsed;
}

const NEGATIVE_PROMPT =
  "Chinese architecture, Chinese lanterns, Korean style, generic Asian, Southeast Asian, anime, illustration, painting, watercolor, 3D render, cartoon, people, faces, text, logo, signature";

async function generateImage(
  prompt: string,
  index: number,
  year: number,
  mood: string,
  userRegion: string,
): Promise<string> {
  const regionSuffix = userRegion ? `, ${userRegion}` : "";
  const enhancedPrompt = `${prompt}, ${JAPAN_SCENE_SUFFIX[index % 4]}, ${eraStyle(year)}, ${moodStyle(mood)}${regionSuffix}, Japan`;
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
    const { memoryText, memoryYear, lifeStage, userRegion = "" } = await request.json();
    const year = parseInt(memoryYear, 10) || new Date().getFullYear();
    const { mood, scenes } = await generateScenes(memoryText, memoryYear, lifeStage, userRegion);
    const images = await Promise.all(
      scenes.map((s, i) => generateImage(s, i, year, mood, userRegion))
    );
    return NextResponse.json({ images });
  } catch (e) {
    console.error("画像生成エラー:", e);
    const message = e instanceof Error ? e.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
