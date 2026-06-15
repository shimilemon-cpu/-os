"use client";

import Link from "next/link";
import type { PlayTemplate } from "@/lib/play-types";

export default function TemplateCard({ template }: { template: PlayTemplate }) {
  return (
    <Link href={`/play/template/${template.id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#ede4d8] active:scale-[0.97] transition-transform">
        <div
          className={`relative bg-gradient-to-br ${template.gradient} flex items-center justify-center`}
          style={{ aspectRatio: "4/3" }}
        >
          <span className="text-5xl drop-shadow-sm">{template.emoji}</span>
          <div className="absolute top-2 right-2">
            <span className="text-[10px] font-medium bg-black/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
              {template.durationLabel}
            </span>
          </div>
        </div>

        <div className="p-3 space-y-1.5">
          <p className="text-[#1c1410] text-sm font-bold leading-snug line-clamp-2">
            {template.title}
          </p>
          <p className="text-[#8a7a70] text-[11px] leading-tight line-clamp-1">
            {template.tagline}
          </p>
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex gap-1 flex-wrap">
              {template.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#f5ede3] text-[#8a7a70]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="text-[10px] text-[#8a7a70] shrink-0">
              {template.doCount.toLocaleString()}人
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
