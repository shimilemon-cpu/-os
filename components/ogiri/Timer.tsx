"use client";

import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";

interface Props {
  deadline: Timestamp | null;
  totalSeconds?: number;
  onExpire?: () => void;
}

export default function Timer({ deadline, totalSeconds, onExpire }: Props) {
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
  const pct = Math.max(0, Math.min(100, (secs / total) * 100));

  const color =
    secs > 30 ? "#2BA35F" : secs > 10 ? "#F4C422" : "#E5402F";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="text-4xl font-display tabular-nums"
        style={{ color, transition: "color 0.3s" }}
      >
        {secs}
      </span>
      <div className="w-28 h-1.5 rounded-full bg-line overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
