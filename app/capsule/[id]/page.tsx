"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Capsule } from "@/lib/types";

export default function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("capsules")
        .select("*, users(nickname, birth_year, gender)")
        .eq("id", id)
        .single<Capsule>();
      setCapsule(data);
      if (data) {
        await supabase.rpc("increment_views", { capsule_id: id });
      }
    };
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!capsule) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-[#c48a9f] border-t-transparent animate-spin" />
      </div>
    );
  }

  const images = [
    capsule.image_1,
    capsule.image_2,
    capsule.image_3,
    capsule.image_4,
  ].filter(Boolean) as string[];

  const age = capsule.users?.birth_year
    ? new Date().getFullYear() - capsule.users.birth_year
    : null;

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <Link
          href="/"
          className="text-[#b899a8] hover:text-[#ede0e8] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0">
          <p className="text-[#ede0e8] text-sm font-medium truncate">
            {capsule.song_title ?? "—"}
          </p>
          <p className="text-[#7a6475] text-xs truncate">
            {capsule.artist_name ?? ""}
          </p>
        </div>
      </div>

      {/* YouTube Player */}
      {capsule.youtube_video_id && (
        <div className="youtube-wrapper bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${capsule.youtube_video_id}?autoplay=0&rel=0&modestbranding=1`}
            title={capsule.song_title ?? ""}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      <div className="px-4 pt-5 space-y-5">
        {/* Memory */}
        <div className="space-y-1">
          <p className="text-[#ede0e8] text-sm leading-relaxed">
            {capsule.memory_text}
          </p>
          <p className="text-[#c48a9f] text-xs">
            {capsule.memory_year}年・{capsule.life_stage}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#7a6475]">
            {age ? `${age}歳` : ""}
            {age && capsule.users?.gender ? "・" : ""}
            {capsule.users?.gender ?? ""}
          </span>
          <div className="flex items-center gap-1 text-[#7a6475]">
            <Eye size={11} />
            <span>{capsule.views.toLocaleString()}回開かれた</span>
          </div>
        </div>

        <div className="border-t border-[#2d1e30]" />

        {/* AI Images */}
        {images.length > 0 && (
          <div>
            <p className="text-[#7a6475] text-[10px] tracking-widest uppercase mb-3">
              AI が描いた記憶のシーン
            </p>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImage]}
                alt=""
                className="w-full h-full object-cover sepia-[.4] brightness-75"
              />
              {activeImage > 0 && (
                <button
                  onClick={() => setActiveImage((i) => i - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1"
                >
                  <ChevronLeft size={16} className="text-white" />
                </button>
              )}
              {activeImage < images.length - 1 && (
                <button
                  onClick={() => setActiveImage((i) => i + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1"
                >
                  <ChevronRight size={16} className="text-white" />
                </button>
              )}
              <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-0.5">
                <span className="text-white text-[10px]">
                  {activeImage + 1} / {images.length}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === i ? "border-[#c48a9f]" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover sepia-[.4] brightness-75"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1520] border border-[#2d1e30]">
          <Music size={16} className="text-[#c48a9f] shrink-0" />
          <div>
            <p className="text-[#ede0e8] text-sm font-medium">
              {capsule.song_title}
            </p>
            <p className="text-[#7a6475] text-xs">{capsule.artist_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
