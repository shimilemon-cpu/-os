// Mascot.tsx — 大喜利Pocket のオリジナルマスコット / アイコン集
// Next.js 16 / React 19 用。SVG は純粋な図形なので依存ゼロでそのまま使えます。
//
// 使い方:
//   <Mascot kind="char_yellow" size={46} />            // キャラ（色は内蔵）
//   <Mascot kind="mic" tint="#FFD600" size={20} />     // UIアイコン（tint=色）
//   <Mascot kind="home" className="text-yellow-400" /> // tint 省略時は currentColor を継承
//
// キャラ系（char_* / r_* / j_*）は配色が SVG に内蔵されているため tint は無視されます。
// UIアイコン系は stroke/fill が currentColor なので tint もしくは親の color で着色します。

import * as React from "react";

export type MascotKind =
  | "char_yellow" | "char_pink" | "char_teal" | "char_purple" | "char_green"
  | "r_funny" | "r_smart" | "r_crazy"
  | "j_king" | "j_sharp" | "j_chaos"
  | "mic" | "home" | "plus" | "person" | "trophy" | "bars" | "link" | "copy"
  | "crown" | "bolt" | "moon" | "beer" | "briefcase" | "clapper" | "check"
  | "fire" | "heart" | "sparkle" | "medal";

export interface MascotProps {
  kind: MascotKind;
  /** UIアイコン系の色。省略時は currentColor を継承。キャラ系では無視。 */
  tint?: string;
  /** px 数値または CSS 文字列。省略時は 1em。 */
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

const svgStyle: React.CSSProperties = { display: "block", overflow: "visible" };

const ICONS: Record<MascotKind, React.ReactElement> = {
  // ───────── キャラクター（顔付きの丸キャラ） ─────────
  char_yellow: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <path d="M20 13l5 9M32 9v13M44 13l-5 9" stroke="#FFD600" strokeWidth="5" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="35" r="23" fill="#FFD600" />
      <circle cx="24" cy="33" r="3.4" fill="#1c1500" />
      <circle cx="40" cy="33" r="3.4" fill="#1c1500" />
      <path d="M23 43q9 8 18 0" stroke="#1c1500" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <circle cx="18" cy="40" r="3" fill="#FF8A1F" opacity=".55" />
      <circle cx="46" cy="40" r="3" fill="#FF8A1F" opacity=".55" />
    </svg>
  ),
  char_pink: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <path d="M17 14l5 14-12-2z" fill="#FF4D6D" />
      <path d="M47 14l-5 14 12-2z" fill="#FF4D6D" />
      <circle cx="32" cy="35" r="23" fill="#FF4D6D" />
      <path d="M19 33q4-5 9 0" stroke="#3a0a14" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="41" cy="33" r="3.4" fill="#3a0a14" />
      <path d="M25 43q7 6 14 0" stroke="#3a0a14" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="20" cy="41" r="2.8" fill="#fff" opacity=".4" />
      <circle cx="44" cy="41" r="2.8" fill="#fff" opacity=".4" />
    </svg>
  ),
  char_teal: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <circle cx="32" cy="36" r="23" fill="#00B4FF" />
      <path d="M11 28q21-20 42 0z" fill="#0a7fb8" />
      <rect x="9" y="26" width="46" height="5" rx="2.5" fill="#0a7fb8" />
      <circle cx="24" cy="36" r="3.4" fill="#042738" />
      <circle cx="40" cy="36" r="3.4" fill="#042738" />
      <path d="M24 46h16" stroke="#042738" strokeWidth="3.6" fill="none" strokeLinecap="round" />
    </svg>
  ),
  char_purple: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <path d="M32 6l1.6 4.4 4.4 1.6-4.4 1.6L32 18l-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#FFD600" />
      <circle cx="32" cy="36" r="22" fill="#BF5FFF" />
      <circle cx="24" cy="34" r="4.2" fill="#2a0f3a" />
      <circle cx="25.6" cy="32.4" r="1.5" fill="#fff" />
      <circle cx="40" cy="34" r="4.2" fill="#2a0f3a" />
      <circle cx="41.6" cy="32.4" r="1.5" fill="#fff" />
      <path d="M25 44q7 7 14 0" stroke="#2a0f3a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  ),
  char_green: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <path d="M32 10q4-6 9-4q-1 6-9 6z" fill="#2faf68" />
      <circle cx="32" cy="36" r="22" fill="#3DDC84" />
      <circle cx="24" cy="34" r="3.4" fill="#093d22" />
      <circle cx="40" cy="34" r="3.4" fill="#093d22" />
      <path d="M24 43q8 7 16 0" stroke="#093d22" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="19" cy="41" r="2.8" fill="#fff" opacity=".35" />
      <circle cx="45" cy="41" r="2.8" fill="#fff" opacity=".35" />
    </svg>
  ),

  // ───────── リアクション ─────────
  r_funny: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <circle cx="32" cy="32" r="26" fill="#FFD600" />
      <path d="M15 27q5.5-6.5 11 0" stroke="#5a4500" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M38 27q5.5-6.5 11 0" stroke="#5a4500" strokeWidth="3.6" fill="none" strokeLinecap="round" />
      <path d="M19 37q13 17 26 0z" fill="#7a2e1a" />
      <path d="M22 43q10 8 20 0z" fill="#ff8a8a" />
      <path d="M52 30q3.2 5 0 8.4q-3.2-3.4 0-8.4z" fill="#5fd0ff" />
    </svg>
  ),
  r_smart: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <circle cx="32" cy="32" r="26" fill="#00B4FF" />
      <rect x="13" y="25" width="17" height="13" rx="6.5" fill="#eaf7ff" stroke="#06324a" strokeWidth="2.6" />
      <rect x="34" y="25" width="17" height="13" rx="6.5" fill="#eaf7ff" stroke="#06324a" strokeWidth="2.6" />
      <path d="M30 30h4" stroke="#06324a" strokeWidth="2.6" />
      <circle cx="21.5" cy="31.5" r="2.4" fill="#06324a" />
      <circle cx="42.5" cy="31.5" r="2.4" fill="#06324a" />
      <path d="M24 47q8 6 16 0" stroke="#06324a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 13l1 3.2 3.2 1-3.2 1-1 3.2-1-3.2-3.2-1 3.2-1z" fill="#fff" />
    </svg>
  ),
  r_crazy: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <circle cx="32" cy="35" r="23" fill="#BF5FFF" />
      <path d="M12 19l4-8 4 6 4-10 4 8 4-6 4 10 4-7" fill="none" stroke="#FFD600" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 31l8 8M27 31l-8 8" stroke="#2a0f3a" strokeWidth="3" strokeLinecap="round" />
      <path d="M37 31l8 8M45 31l-8 8" stroke="#2a0f3a" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="32" cy="47" rx="6" ry="7" fill="#2a0f3a" />
    </svg>
  ),

  // ───────── AI審査員 ─────────
  j_king: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <path d="M12 30l-1-14 9 8 4-13 8 11 8-11 4 13 9-8-1 14z" fill="#FFD600" stroke="#d99a00" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="20" cy="20" r="1.8" fill="#FF4D6D" />
      <circle cx="44" cy="20" r="1.8" fill="#5fd0ff" />
      <circle cx="32" cy="40" r="20" fill="#FFE27A" />
      <circle cx="25" cy="39" r="3.2" fill="#6a5200" />
      <circle cx="39" cy="39" r="3.2" fill="#6a5200" />
      <path d="M24 47q8 8 16 0" stroke="#6a5200" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </svg>
  ),
  j_sharp: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <circle cx="32" cy="35" r="23" fill="#FF4D6D" />
      <path d="M18 27l11 4" stroke="#3a0a14" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M46 27l-11 4" stroke="#3a0a14" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="25" cy="36" r="3" fill="#3a0a14" />
      <circle cx="39" cy="36" r="3" fill="#3a0a14" />
      <path d="M25 48q7 5 14 0" stroke="#3a0a14" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M51 21q3.5 6 0 9q-3.5-3 0-9z" fill="#bfe9ff" />
    </svg>
  ),
  j_chaos: (
    <svg viewBox="0 0 64 64" width="100%" height="100%" style={svgStyle}>
      <circle cx="32" cy="35" r="23" fill="#BF5FFF" />
      <path d="M32 13a3.5 3.5 0 1 1-3.5 3.5 7 7 0 1 1 7-7" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22 34a3 3 0 1 1-3-3" fill="none" stroke="#2a0f3a" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="22" cy="34" r="1.1" fill="#2a0f3a" />
      <path d="M44 34a3 3 0 1 1-3-3" fill="none" stroke="#2a0f3a" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="44" cy="34" r="1.1" fill="#2a0f3a" />
      <path d="M22 45q5 5 10 0t10 0" fill="none" stroke="#2a0f3a" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),

  // ───────── UIアイコン（currentColor で着色） ─────────
  mic: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10.5V20h12v-9.5" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  person: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="currentColor">
      <circle cx="12" cy="8" r="4.2" />
      <path d="M3.5 21a8.5 7 0 0 1 17 0z" />
    </svg>
  ),
  trophy: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 2.5M17 6h2.5a2.5 2.5 0 0 1-2.5 2.5" />
      <path d="M12 14v3M8.5 20h7M9.5 20l.5-3h4l.5 3" />
    </svg>
  ),
  bars: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="currentColor">
      <rect x="3.5" y="12" width="4" height="8" rx="1" />
      <rect x="10" y="6" width="4" height="14" rx="1" />
      <rect x="16.5" y="9" width="4" height="11" rx="1" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="M8.3 10.7 15.7 6.3M8.3 13.3l7.4 4.4" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="4" y="4" width="11" height="11" rx="2.5" fill="currentColor" opacity=".45" />
      <rect x="9" y="9" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  crown: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }}>
      <path d="M3 18l-1-11 6 5 4-8 4 8 6-5-1 11z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="currentColor">
      <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
    </svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="currentColor">
      <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />
    </svg>
  ),
  beer: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }}>
      <path d="M6 9q0-4 5-4t5 4" fill="#fff" />
      <rect x="6" y="9" width="10" height="12" rx="2" fill="currentColor" />
      <path d="M16 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="3" y="8" width="18" height="12" rx="2.5" fill="currentColor" />
      <path d="M9 8V6.5A2 2 0 0 1 11 4.5h2a2 2 0 0 1 2 2V8" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  clapper: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }}>
      <rect x="3" y="9" width="18" height="11" rx="1.5" fill="currentColor" />
      <path d="M3.5 9l1-3.8 17.5-1.2-1 3.8z" fill="currentColor" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l5 5L19 6" />
    </svg>
  ),
  fire: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="currentColor">
      <path d="M12 2c2 4 6 5 6 10a6 6 0 0 1-12 0c0-2.5 1.5-3.5 2.5-5 .8 1.6 2 1.8 2.8.8.6-1.6-.3-4-1.3-5.8z" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="currentColor">
      <path d="M12 20.5C5 14 3 10.5 5.8 7.6a4 4 0 0 1 6.2.8 4 4 0 0 1 6.2-.8C21 10.5 19 14 12 20.5z" />
    </svg>
  ),
  sparkle: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }} fill="currentColor">
      <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" />
    </svg>
  ),
  medal: (
    <svg viewBox="0 0 24 24" width="100%" height="100%" style={{ display: "block" }}>
      <path d="M8 2l3 7H8L5 2z" fill="#FF4D6D" />
      <path d="M16 2l-3 7h3l3-7z" fill="#5fd0ff" />
      <circle cx="12" cy="15" r="6.5" fill="currentColor" />
      <path d="M12 11.5l1.2 2.5 2.7.3-2 1.8.6 2.7L12 17.6l-2.5 1.1.6-2.7-2-1.8 2.7-.3z" fill="#fff" opacity=".9" />
    </svg>
  ),
};

export default function Mascot({ kind, tint, size = "1em", className, style, title }: MascotProps) {
  return (
    <span
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        lineHeight: 0,
        color: tint,
        ...style,
      }}
    >
      {ICONS[kind]}
    </span>
  );
}

/** プレイヤー名 → キャラ kind の対応（プロトタイプと同じ割り当て）。 */
export const NAME_TO_KIND: Record<string, MascotKind> = {
  ユウタ: "char_yellow",
  あや: "char_pink",
  ケンジ: "char_teal",
  マリ: "char_purple",
  あなた: "char_green",
};
