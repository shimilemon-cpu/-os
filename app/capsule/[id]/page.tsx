"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { mockCapsules } from "@/lib/mock-data";

export default function CapsulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const capsule = mockCapsules.find((c) => c.id === id);
  const [activeImage, setActiveImage] = useState(0);

  if (!capsule) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-[#7a6475]">カプセルが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Back header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <Link href="/" className="text-[#b899a8] hover:text-[#ede0e8] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0">
          <p className="text-[#ede0e8] text-sm font-medium truncate">
            {capsule.song.title}
          </p>
          <p className="text-[#7a6475] text-xs truncate">{capsule.song.artist}</p>
        </div>
      </div>

      {/* YouTube Player */}
      <div className="youtube-wrapper bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${capsule.song.youtubeVideoId}?autoplay=0&rel=0&modestbranding=1`}
          title={capsule.song.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Main content */}
      <div className="px-4 pt-5 space-y-5">
        {/* Memory text */}
        <div className="space-y-1">
          <p className="text-[#ede0e8] text-sm leading-relaxed">
            {capsule.memoryText}
          </p>
          <p className="text-[#c48a9f] text-xs">
            {capsule.memoryYear}年・{capsule.lifeStage}
          </p>
        </div>

        {/* User + views */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#7a6475]">
            {capsule.user.age}歳・{capsule.user.gender}
          </span>
          <div className="flex items-center gap-1 text-[#7a6475]">
            <Eye size={11} />
            <span>{capsule.views.toLocaleString()}回開かれた</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#2d1e30]" />

        {/* AI Images */}
        <div>
          <p className="text-[#7a6475] text-[10px] tracking-widest uppercase mb-3">
            AI が描いた記憶のシーン
          </p>

          {/* Main image */}
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capsule.images[activeImage]}
              alt=""
              className="w-full h-full object-cover sepia-[.4] brightness-75"
            />
            {/* Navigation arrows */}
            {activeImage > 0 && (
              <button
                onClick={() => setActiveImage((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1"
              >
                <ChevronLeft size={16} className="text-white" />
              </button>
            )}
            {activeImage < 3 && (
              <button
                onClick={() => setActiveImage((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1"
              >
                <ChevronRight size={16} className="text-white" />
              </button>
            )}
            {/* Scene number */}
            <div className="absolute bottom-2 right-2 bg-black/50 rounded-full px-2 py-0.5">
              <span className="text-white text-[10px]">
                {activeImage + 1} / 4
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="grid grid-cols-4 gap-1.5">
            {capsule.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  activeImage === i
                    ? "border-[#c48a9f]"
                    : "border-transparent"
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

        {/* Song info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1520] border border-[#2d1e30]">
          <Music size={16} className="text-[#c48a9f] shrink-0" />
          <div>
            <p className="text-[#ede0e8] text-sm font-medium">
              {capsule.song.title}
            </p>
            <p className="text-[#7a6475] text-xs">{capsule.song.artist}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
