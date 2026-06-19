"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export type Theme = "sepia" | "wine";

const OPTIONS: { id: Theme; name: string; desc: string; swatch: string[] }[] = [
  {
    id: "sepia",
    name: "琥珀",
    desc: "温かいセピア茶。夕日とフィルムの郷愁。",
    swatch: ["#1b1410", "#2a1f17", "#e0a567", "#f3e7d6"],
  },
  {
    id: "wine",
    name: "葡萄酒",
    desc: "深い葡萄茶に薔薇色。夜更けの切なさ。",
    swatch: ["#1d1418", "#2c1e27", "#d191a6", "#f1e3eb"],
  },
];

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>("sepia");

  useEffect(() => {
    const saved = (document.documentElement.dataset.theme as Theme) || "sepia";
    setTheme(saved);
  }, []);

  const apply = (t: Theme) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("capsule_theme", t);
    } catch {
      // localStorage が使えない環境では何もしない
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[var(--muted)] text-[10px] tracking-widest uppercase">テーマ（色合い）</p>
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => {
          const active = theme === o.id;
          return (
            <button
              key={o.id}
              onClick={() => apply(o.id)}
              className={`relative text-left rounded-xl p-3 border transition-colors ${
                active
                  ? "border-[var(--accent)] bg-[var(--surface)]"
                  : "border-[var(--border)] bg-[var(--bg-elev)]"
              }`}
            >
              {active && (
                <span className="absolute top-2 right-2 text-[var(--accent)]">
                  <Check size={14} />
                </span>
              )}
              <div className="flex gap-1 mb-2">
                {o.swatch.map((c, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full border border-black/20"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <p className="serif text-[var(--text)] text-sm">{o.name}</p>
              <p className="text-[var(--muted)] text-[10px] leading-relaxed mt-0.5">{o.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
