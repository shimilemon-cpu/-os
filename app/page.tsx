"use client";

import { useState } from "react";
import CapsuleCard from "@/components/CapsuleCard";
import { mockCapsules } from "@/lib/mock-data";

const TABS = ["おすすめ", "新着", "同世代"] as const;
type Tab = (typeof TABS)[number];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("おすすめ");

  // In the mock, all tabs show the same data
  const capsules = mockCapsules;

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <div className="px-4 pt-12 pb-0">
          <h1 className="text-[#c48a9f] text-xl font-bold tracking-[0.2em]">
            CAPSULE
          </h1>
          <p className="text-[#7a6475] text-[10px] mt-0.5 tracking-wider">
            3分半で、あの日に帰ろう。
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mt-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs tracking-wide transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-[#c48a9f] border-[#c48a9f]"
                  : "text-[#7a6475] border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Capsule grid */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {capsules.map((capsule) => (
          <CapsuleCard key={capsule.id} capsule={capsule} />
        ))}
      </div>
    </div>
  );
}
