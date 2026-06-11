import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fal } from "@fal-ai/client";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

fal.config({ credentials: process.env.FAL_KEY });

async function generateScenes(
  memoryText: string,
  memoryYear: string,
  lifeStage: string
): Promise<string[]> {
  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are generating image prompts for a nostalgic Japanese memory capsule app.

User's memory (Japanese): "${memoryText}"
Year: ${memoryYear}
Life stage: ${lifeStage}

Generate 4 cinematic scene descriptions in English for image generation.
Each scene should be 1-2 sentences, capturing the mood and setting.
Style: nostalgic, cinematic, warm, Japanese scenery, no detailed faces, film grain, golden hour or night lighting.

Return ONLY a JSON array of 4 strings. Example: ["scene1", "scene2", "scene3", "scene4"]`,
      },
    ],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Invalid scene response");
  return JSON.parse(match[0]) as string[];
}

async function generateImage(prompt: string): Promise<string> {
  const basePrompt = `${prompt}, nostalgic, cinematic, film photography, warm tones, shallow depth of field, Japanese setting, no faces`;

  const result = (await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt: basePrompt,
      image_size: { width: 576, height: 1024 },
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    },
  })) as unknown as { images: { url: string }[] };

  return result.images[0].url;
}

async function uploadToSupabase(
  imageUrl: string,
  capsuleId: string,
  index: number
): Promise<string> {
  const supabase = await createClient();

  const res = await fetch(imageUrl);
  const blob = await res.blob();
  const buffer = Buffer.from(await blob.arrayBuffer());

  const path = `${capsuleId}/${index}.webp`;
  const { error } = await supabase.storage
    .from("capsule-images")
    .upload(path, buffer, { contentType: "image/webp", upsert: true });

  if (error) return imageUrl;

  const { data } = supabase.storage.from("capsule-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function POST(request: Request) {
  try {
    const { memoryText, memoryYear, lifeStage, capsuleId } =
      await request.json();

    // シーン生成
    const scenes = await generateScenes(memoryText, memoryYear, lifeStage);

    // 4枚並列生成
    const imageUrls = await Promise.all(scenes.map((s) => generateImage(s)));

    // Supabase Storageにアップロード
    const storedUrls = await Promise.all(
      imageUrls.map((url, i) => uploadToSupabase(url, capsuleId, i + 1))
    );

    return NextResponse.json({ images: storedUrls });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
