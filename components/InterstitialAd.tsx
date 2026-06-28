"use client";

import { useEffect, useState } from "react";
import AdSlot from "@/components/AdSlot";

interface InterstitialAdProps {
  onClose: () => void;
  skipAfter?: number;
}

export default function InterstitialAd({ onClose, skipAfter = 5 }: InterstitialAdProps) {
  const [countdown, setCountdown] = useState(skipAfter);

  useEffect(() => {
    if (countdown <= 0) {
      onClose();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-sm flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <p className="text-[10px] text-zinc-700 tracking-widest uppercase">広告</p>
          <p className="text-xs text-zinc-500">このゲームは広告で支えられています</p>
        </div>

        <AdSlot id="interstitial-main" size="interstitial" className="w-full" />

        <button
          onClick={countdown <= 0 ? onClose : undefined}
          disabled={countdown > 0}
          className="w-full py-3.5 rounded-2xl text-sm font-bold border transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed border-zinc-700 text-zinc-400 disabled:border-zinc-800"
        >
          {countdown > 0 ? `スキップ（${countdown}）` : "スキップ →"}
        </button>
      </div>
    </div>
  );
}
