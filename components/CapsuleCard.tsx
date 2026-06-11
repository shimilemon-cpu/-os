import Link from "next/link";
import { Eye, Music } from "lucide-react";
import type { Capsule } from "@/lib/mock-data";

export default function CapsuleCard({ capsule }: { capsule: Capsule }) {
  return (
    <Link href={`/capsule/${capsule.id}`} className="block group">
      <div className="relative rounded-xl overflow-hidden bg-[#1a1520] border border-[#2d1e30]">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={capsule.images[0]}
            alt=""
            className="w-full h-full object-cover sepia-[.35] brightness-75 group-hover:scale-105 transition-transform duration-700"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0b0e] via-[#0e0b0e]/30 to-transparent" />

          {/* Song info at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2">
              <Music size={11} className="text-[#c48a9f] shrink-0" />
              <div className="min-w-0">
                <p className="text-[#ede0e8] text-xs font-medium truncate leading-tight">
                  {capsule.song.title}
                </p>
                <p className="text-[#b899a8] text-[10px] truncate leading-tight">
                  {capsule.song.artist}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Text area */}
        <div className="p-3 space-y-2">
          <p className="text-[#ede0e8] text-xs leading-relaxed line-clamp-2">
            {capsule.memoryText}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[#7a6475] text-[10px]">
              {capsule.user.age}歳・{capsule.user.gender}
            </span>
            <div className="flex items-center gap-1 text-[#7a6475]">
              <Eye size={10} />
              <span className="text-[10px]">{capsule.views.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-[#7a6475] text-[10px]">
            {capsule.memoryYear}年・{capsule.lifeStage}
          </p>
        </div>
      </div>
    </Link>
  );
}
