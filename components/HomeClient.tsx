"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import CapsuleCard from "@/components/CapsuleCard";
import type { CapsuleDoc } from "@/lib/types";

const TABS = ["おすすめ", "新着", "同世代"] as const;
type Tab = (typeof TABS)[number];

const ALL = "すべて";

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState<Tab>("おすすめ");
  const [decade, setDecade] = useState<number | typeof ALL>(ALL);
  const [capsules, setCapsules] = useState<CapsuleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "capsules"),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as CapsuleDoc))
          .filter((c) => c.status === "published");
        setCapsules(data);
      } catch (e) {
        console.error("カプセル読み込み失敗:", e);
        setCapsules([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // データに存在する年代だけをチップに出す（古い順）
  const decades = Array.from(
    new Set(
      capsules
        .map((c) => c.memoryYear)
        .filter((y): y is number => typeof y === "number")
        .map((y) => Math.floor(y / 10) * 10)
    )
  ).sort((a, b) => a - b);

  const visible =
    decade === ALL
      ? capsules
      : capsules.filter(
          (c) =>
            typeof c.memoryYear === "number" &&
            Math.floor(c.memoryYear / 10) * 10 === decade
        );

  return (
    <div className="pb-20">
      <header className="sticky top-0 z-40 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <div className="px-4 pt-12 pb-0">
          <h1 className="serif text-[#c48a9f] text-xl font-bold tracking-[0.2em]">CAPSULE</h1>
          <p className="text-[#7a6475] text-[10px] mt-0.5 tracking-wider">3分半で、あの日に帰ろう。</p>
        </div>
        <div className="flex mt-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs tracking-wide transition-colors border-b-2 ${
                activeTab === tab ? "text-[#c48a9f] border-[#c48a9f]" : "text-[#7a6475] border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 年代で探す */}
        {decades.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5">
            {[ALL, ...decades].map((d) => {
              const active = decade === d;
              return (
                <button
                  key={String(d)}
                  onClick={() => setDecade(d as number | typeof ALL)}
                  className={`shrink-0 px-3 py-1 rounded-full text-[11px] tracking-wide border transition-colors ${
                    active
                      ? "border-[#c48a9f] text-[#c48a9f] bg-[#c48a9f]/10"
                      : "border-[#2d1e30] text-[#7a6475]"
                  }`}
                >
                  {d === ALL ? ALL : `${d}年代`}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-[#c48a9f] border-t-transparent animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <p className="text-[#7a6475] text-sm">
            {decade === ALL ? "まだカプセルがありません" : `${decade}年代のカプセルはまだありません`}
          </p>
          <p className="text-[#7a6475] text-xs">最初の記憶を残してみませんか？</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {visible.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
      )}
    </div>
  );
}
