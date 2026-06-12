import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
fal.config({ credentials: process.env.FAL_KEY });

async function generateScenes(memoryText: string, memoryYear: string, lifeStage: string): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `Generate 4 cinematic image prompts for a nostalgic Japanese memory capsule app.

Memory (Japanese): "${memoryText}"
Year: ${memoryYear}, Life stage: ${lifeStage}

Each prompt: 1-2 sentences, cinematic, nostalgic, warm, Japanese scenery, no faces, film grain.
Return ONLY a JSON array of 4 strings.`,
    }],
  });
  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Invalid scene response");
  return JSON.parse(match[0]) as string[];
}

async function generateImage(prompt: string): Promise<string> {
  const result = (await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: `${prompt}, nostalgic, cinematic, film photography, warm tones, Japanese setting, no faces`,
      image_size: { width: 576, height: 1024 },
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    },
  })) as unknown as { images: { url: string }[] };
  return result.images[0].url;
}

export async function POST(request: Request) {
  try {
    const { memoryText, memoryYear, lifeStage } = await request.json();
    const scenes = await generateScenes(memoryText, memoryYear, lifeStage);
    const images = await Promise.all(scenes.map((s) => generateImage(s)));
    return NextResponse.json({ images });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
