"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Shuffle } from "lucide-react";
import TemplateCard from "@/components/play/TemplateCard";
import { mockTemplates, CATEGORIES, FEATURED_ID } from "@/lib/play-mock-data";
import type { PlayCategory } from "@/lib/play-types";

export default function PlayHomePage() {
  const [activeCategory, setActiveCategory] = useState<PlayCategory>("すべて");

  const featured = mockTemplates.find((t) => t.id === FEATURED_ID)!;

  const grid = mockTemplates.filter((t) => {
    if (t.id === FEATURED_ID) return false;
    if (activeCategory === "すべて") return true;
    return t.primaryCategory === activeCategory || t.tags.includes(activeCategory);
  });

  const randomTemplate = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];

  return (
    <div className="pb-24 bg-[#fffbf7] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fffbf7]/95 backdrop-blur border-b border-[#ede4d8]">
        <div className="px-4 pt-12 pb-3 flex items-start justify-between">
          <div>
            <h1 className="text-[#ff5f3d] text-2xl font-black tracking-tight leading-none">
              あそびかた
            </h1>
            <p className="text-[#8a7a70] text-xs mt-1">休日のすごし方、見つけよう</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white border border-[#ede4d8] flex items-center justify-center shadow-sm shrink-0 mt-1">
            <Search size={18} className="text-[#8a7a70]" />
          </button>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-5">
        {/* Featured card */}
        <Link href={`/play/template/${featured.id}`} className="block">
          <div
            className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${featured.gradient} p-5 shadow-lg`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                  ✨ 今日の提案
                </span>
                <h2 className="text-white text-xl font-black mt-1 leading-tight">
                  {featured.title}
                </h2>
                <p className="text-white/80 text-xs mt-1 leading-relaxed">
                  {featured.tagline}
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="text-xs bg-white/25 text-white px-2.5 py-1 rounded-full">
                    {featured.durationLabel}
                  </span>
                  <span className="text-xs bg-white/25 text-white px-2.5 py-1 rounded-full">
                    {featured.peopleLabel}
                  </span>
                </div>
                <div className="mt-4 inline-block bg-white text-[#f97316] text-sm font-bold px-5 py-2 rounded-full shadow-sm">
                  やってみる →
                </div>
              </div>
              <span className="text-7xl shrink-0 drop-shadow">{featured.emoji}</span>
            </div>
          </div>
        </Link>

        {/* Random shuffle button */}
        <Link
          href={`/play/template/${randomTemplate.id}`}
          className="flex items-center gap-2 w-full bg-white border border-[#ede4d8] rounded-2xl px-4 py-3 shadow-sm active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-[#fff0ed] flex items-center justify-center shrink-0">
            <Shuffle size={18} className="text-[#ff5f3d]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#1c1410] text-sm font-bold">ランダムで選んでもらう</p>
            <p className="text-[#8a7a70] text-xs">迷ったときはおまかせで</p>
          </div>
          <span className="text-[#8a7a70] text-lg">›</span>
        </Link>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-[#ff5f3d] text-white shadow-sm"
                  : "bg-white border border-[#ede4d8] text-[#8a7a70]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between">
          <h2 className="text-[#1c1410] text-base font-bold">
            {activeCategory === "すべて" ? "すべてのテンプレ" : `「${activeCategory}」のテンプレ`}
          </h2>
          <span className="text-[#8a7a70] text-xs">{grid.length}件</span>
        </div>

        {/* Template grid */}
        {grid.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {grid.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="text-4xl mb-3">🤔</span>
            <p className="text-[#8a7a70] text-sm">
              このカテゴリのテンプレはまだありません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
