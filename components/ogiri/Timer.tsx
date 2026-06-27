"use client";

import { useEffect, useState } from "react";
import type { Timestamp } from "firebase/firestore";

interface Props {
  deadline: Timestamp | null;
  onExpire?: () => void;
}

export default function Timer({ deadline, onExpire }: Props) {
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

  const pct = deadline
    ? Math.max(0, Math.min(100, ((deadline.toDate().getTime() - Date.now()) /
        (deadline.toDate().getTime() - Date.now() + secs * 1000)) * 100))
    : 100;

  const color =
    secs > 30 ? "var(--ok)" : secs > 10 ? "var(--gold)" : "var(--danger)";

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="text-4xl font-bold tabular-nums"
        style={{ color, transition: "color 0.3s" }}
      >
        {secs}
      </span>
      <div className="w-24 h-1 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
