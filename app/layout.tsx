import type { Metadata, Viewport } from "next";
import { Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";

const mincho = Shippori_Mincho_B1({
  weight: ["500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-mincho",
});

const kaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-kaku",
});

export const metadata: Metadata = {
  title: "大喜利Pocket",
  description: "AIがあなたたちだけの笑いを覚える大喜利アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "大喜利Pocket",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBF7EC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`h-full ${mincho.variable} ${kaku.variable}`}>
      <body className="min-h-full bg-ink font-body text-text">
        {/* 縁起物SVGシンボル定義（全画面で <use href="#c-daruma"> 等が使える） */}
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <defs>
            <linearGradient id="g-flame" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor="#F6CE3E" /><stop offset="0.45" stopColor="#F0922B" /><stop offset="1" stopColor="#E5402F" />
            </linearGradient>
            <linearGradient id="g-leaf" x1="0" y1="0" x2="0.3" y2="1">
              <stop offset="0" stopColor="#3FC07A" /><stop offset="0.55" stopColor="#86CE38" /><stop offset="1" stopColor="#F4C422" />
            </linearGradient>
            <linearGradient id="g-gold" x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0" stopColor="#FBE08C" /><stop offset="0.5" stopColor="#F4C422" /><stop offset="1" stopColor="#EF9C24" />
            </linearGradient>

            <symbol id="c-daruma" viewBox="0 0 100 112">
              <path d="M50,6 C27,6 13,28 12,54 C11,83 28,107 50,107 C72,107 89,83 88,54 C87,28 73,6 50,6 Z" fill="#EE4F3A"/>
              <ellipse cx="50" cy="60" rx="31" ry="30" fill="#FFEED6"/>
              <path d="M28,47 Q31,37 45,44 Q38,49 30,49 Z" fill="#2B2017"/>
              <path d="M72,47 Q69,37 55,44 Q62,49 70,49 Z" fill="#2B2017"/>
              <ellipse cx="40" cy="58" rx="4.6" ry="6" fill="#FFFFFF"/><circle cx="40" cy="59" r="3" fill="#2B2017"/>
              <ellipse cx="60" cy="58" rx="4.6" ry="6" fill="#FFFFFF"/><circle cx="60" cy="59" r="3" fill="#2B2017"/>
              <path d="M41,69 Q50,76 59,69" fill="none" stroke="#2B2017" strokeWidth="3" strokeLinecap="round"/>
              <path d="M50,64 L50,69" stroke="#2B2017" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="29" cy="66" r="5" fill="#F4A0A8"/><circle cx="71" cy="66" r="5" fill="#F4A0A8"/>
              <path d="M38,98 L38,104 M50,99 L50,105 M62,98 L62,104" stroke="#FFEED6" strokeWidth="3" strokeLinecap="round"/>
            </symbol>

            <symbol id="c-cat" viewBox="0 0 112 120">
              <path d="M41,18 C31,9 25,4 28,2 C32,0 45,8 50,19 Z" fill="#FFFFFF" stroke="#E7DDC7" strokeWidth="2.4"/>
              <path d="M71,18 C81,9 87,4 84,2 C80,0 67,8 62,19 Z" fill="#FFFFFF" stroke="#E7DDC7" strokeWidth="2.4"/>
              <path d="M56,7 C33,7 17,26 17,49 C17,60 21,68 28,74 C20,83 17,98 23,109 C28,118 84,118 89,109 C95,98 92,83 84,74 C88,71 91,67 92,62 C94,56 91,52 87,53 C90,55 92,57 92,49 C92,26 79,7 56,7 Z" fill="#FFFFFF" stroke="#E7DDC7" strokeWidth="2.4"/>
              <ellipse cx="90" cy="60" rx="9" ry="12" fill="#FFFFFF" stroke="#E7DDC7" strokeWidth="2.4"/>
              <path d="M30,12 C24,20 23,30 27,38 C19,30 20,16 30,9 Z" fill="#F2A03C"/>
              <circle cx="45" cy="46" r="4.2" fill="#2B2017"/>
              <circle cx="67" cy="46" r="4.2" fill="#2B2017"/>
              <path d="M52,52 L60,52 L56,57 Z" fill="#F39AA6"/>
              <path d="M56,57 Q52,61 48,59 M56,57 Q60,61 64,59" fill="none" stroke="#2B2017" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="33" cy="53" r="4.6" fill="#F4A0A8"/><circle cx="79" cy="53" r="4.6" fill="#F4A0A8"/>
              <path d="M30,74 Q56,87 82,74 L80,83 Q56,93 32,83 Z" fill="#EE4F3A"/>
              <circle cx="56" cy="83" r="6" fill="#F4C422" stroke="#E0A93B" strokeWidth="1.6"/>
              <ellipse cx="57" cy="104" rx="12" ry="7.5" fill="#F4C422" stroke="#E0A93B" strokeWidth="1.6"/>
            </symbol>

            <symbol id="c-tai" viewBox="0 0 124 84">
              <path d="M92,42 L120,14 Q124,42 120,70 Z" fill="#F6A623"/>
              <path d="M58,18 Q66,8 74,16 L70,30 Z" fill="#F6A623"/>
              <path d="M58,66 Q66,76 74,68 L70,54 Z" fill="#F6A623"/>
              <path d="M8,42 C22,15 66,11 96,26 C104,32 106,42 104,46 C106,52 104,60 96,60 C66,73 22,69 8,42 Z" fill="#F0552E"/>
              <path d="M40,20 Q44,42 40,64" fill="none" stroke="#D63D22" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="26" cy="38" r="8.5" fill="#FFFFFF"/><circle cx="26" cy="38" r="4" fill="#2B2017"/><circle cx="24" cy="36" r="1.5" fill="#fff"/>
              <path d="M6,40 Q2,44 6,48" fill="none" stroke="#F6A623" strokeWidth="4" strokeLinecap="round"/>
            </symbol>

            <symbol id="c-fuku" viewBox="0 0 100 116">
              <path d="M50,72 C74,72 87,92 82,114 L18,114 C13,92 26,72 50,72 Z" fill="#2C3E63"/>
              <path d="M39,73 Q50,86 61,73 L57,100 L43,100 Z" fill="#FFEED6"/>
              <rect x="44" y="3" width="12" height="9" rx="4" fill="#2B2017"/>
              <circle cx="50" cy="42" r="32" fill="#FFEED6"/>
              <circle cx="18" cy="44" r="7.5" fill="#FFEED6"/>
              <circle cx="82" cy="44" r="7.5" fill="#FFEED6"/>
              <path d="M19,38 C22,16 78,16 81,38 C72,24 28,24 19,38 Z" fill="#5BA9D6"/>
              <circle cx="40" cy="48" r="3.6" fill="#2B2017"/>
              <circle cx="60" cy="48" r="3.6" fill="#2B2017"/>
              <path d="M44,57 Q50,63 56,57" fill="none" stroke="#EE4F3A" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="31" cy="55" r="5" fill="#F4A0A8"/>
              <circle cx="69" cy="55" r="5" fill="#F4A0A8"/>
            </symbol>

            <symbol id="c-koban" viewBox="0 0 100 66">
              <ellipse cx="50" cy="33" rx="46" ry="27" fill="#F4C422"/>
              <path d="M22,24 H78 M20,33 H80 M22,42 H78" stroke="#E0A93B" strokeWidth="3.4" strokeLinecap="round"/>
            </symbol>

            <symbol id="c-mallet" viewBox="0 0 110 110">
              <rect x="14" y="64" width="70" height="14" rx="7" transform="rotate(-32 49 71)" fill="#E8B45C"/>
              <rect x="50" y="14" width="46" height="40" rx="12" transform="rotate(-32 73 34)" fill="#F4C422"/>
              <circle cx="73" cy="34" r="8" fill="none" stroke="#E0A93B" strokeWidth="3"/>
            </symbol>

            <symbol id="c-mask" viewBox="0 0 100 104">
              <path d="M50,14 C26,14 14,32 14,56 C14,82 30,98 50,98 C70,98 86,82 86,56 C86,32 74,14 50,14 Z" fill="#F0552E"/>
              <path d="M12,22 Q50,8 88,22 L84,34 Q50,22 16,34 Z" fill="#5BA9D6"/>
              <circle cx="50" cy="20" r="6" fill="#5BA9D6"/>
              <circle cx="37" cy="55" r="3.2" fill="#2B2017"/>
              <circle cx="64" cy="53" r="3.2" fill="#2B2017"/>
              <circle cx="28" cy="61" r="4.5" fill="#F4A0A8"/>
              <ellipse cx="46" cy="78" rx="9" ry="11" fill="#FFEED6"/>
              <ellipse cx="46" cy="78" rx="4" ry="6" fill="#EE4F3A"/>
            </symbol>
          </defs>
        </svg>

        <div className="relative mx-auto max-w-sm min-h-screen">
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
