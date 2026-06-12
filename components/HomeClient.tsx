"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import CapsuleCard from "@/components/CapsuleCard";
import type { CapsuleDoc } from "@/lib/types";

const TABS = ["おすすめ", "新着", "同世代"] as const;
type Tab = (typeof TABS)[number];

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState<Tab>("おすすめ");
  const [capsules, setCapsules] = useState<CapsuleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const q = query(
        collection(db, "capsules"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as CapsuleDoc))
        .filter((c) => c.status === "published");
      setCapsules(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="pb-20">
      <header className="sticky top-0 z-40 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <div className="px-4 pt-12 pb-0">
          <h1 className="text-[#c48a9f] text-xl font-bold tracking-[0.2em]">CAPSULE</h1>
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
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 rounded-full border-2 border-[#c48a9f] border-t-transparent animate-spin" />
        </div>
      ) : capsules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <p className="text-[#7a6475] text-sm">まだカプセルがありません</p>
          <p className="text-[#7a6475] text-xs">最初の記憶を残してみませんか？</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4">
          {capsules.map((capsule) => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
      )}
    </div>
  );
}
