"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/rooms",
    label: "寄合所",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#E5402F" : "#B6AC97"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    ),
  },
  {
    href: "/rooms/new",
    label: "部屋を立てる",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#E5402F" : "#B6AC97"} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v8M8 12h8"/>
      </svg>
    ),
  },
  {
    href: "/mypage",
    label: "マイページ",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#E5402F" : "#B6AC97"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.includes("/game") || pathname.includes("/summary")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 max-w-sm mx-auto"
      style={{ background: "#ffffff", borderTop: "1px solid #E4DCCF" }}
    >
      {items.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== "/rooms" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-5 py-2 transition-colors"
            style={{ color: active ? "#E5402F" : "#B6AC97" }}
          >
            {icon(active)}
            <span className="text-[10px] font-bold tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
