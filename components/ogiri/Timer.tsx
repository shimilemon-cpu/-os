"use client";

import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";

interface Props {
  deadline: Timestamp | null;
  totalSeconds?: number;
  onExpire?: () => void;
  variant?: "ring" | "text";
}

const RADIUS = 20;
const CIRC = 2 * Math.PI * RADIUS;

export default function Timer({ deadline, totalSeconds, onExpire, variant = "ring" }: Props) {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline) return;
    const end = deadline.toDate().getTime();
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      setSecs(remaining);
      if (remaining === 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [deadline, onExpire]);

  if (secs === null) return null;

  const total = totalSeconds ?? 90;
  const pct = Math.max(0, Math.min(1, secs / total));
  const color = secs > 30 ? "#2BA35F" : secs > 10 ? "#F4C422" : "#E5402F";

  if (variant === "text") {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return (
      <span className="font-display font-bold tabular-nums text-sm" style={{ color }}>
        {m}:{s}
      </span>
    );
  }

  const offset = CIRC * (1 - pct);

  return (
    <div className="relative w-[54px] h-[54px] flex-none">
      <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="27" cy="27" r={RADIUS} fill="none" stroke="#E4DCCF" strokeWidth="4" />
        <circle
          cx="27" cy="27" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s linear, stroke 0.3s" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-display font-bold text-lg tabular-nums"
        style={{ color }}
      >
        {secs}
      </span>
    </div>
  );
}
