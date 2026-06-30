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
    <div className="fixed inset-0 z-50 bg-[#1A1714]/80 backdrop-blur-sm flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-surface rounded-3xl p-6 space-y-4" style={{ boxShadow: "0 24px 48px -12px rgba(26,23,20,.35)" }}>
          <div className="text-center space-y-1">
            <p className="text-[10px] text-text-muted tracking-widest uppercase">広告</p>
            <p className="text-xs text-text-muted">このゲームは広告で支えられています</p>
          </div>
          <AdSlot id="interstitial-main" size="interstitial" className="w-full" />
          <button
            onClick={countdown <= 0 ? onClose : undefined}
            disabled={countdown > 0}
            className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-text-muted"
            style={{ border: "1px solid rgba(0,0,0,.15)" }}
          >
            {countdown > 0 ? `スキップ（${countdown}）` : "スキップ →"}
          </button>
        </div>
      </div>
    </div>
  );
}
