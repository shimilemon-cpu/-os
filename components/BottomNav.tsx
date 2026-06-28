"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Mascot from "@/components/Mascot";

const items = [
  { href: "/rooms", label: "ルーム", kind: "home" as const },
  { href: "/rooms/new", label: "作成", kind: "plus" as const },
  { href: "/mypage", label: "マイページ", kind: "person" as const },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.includes("/game") || pathname.includes("/summary")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-surface border-t border-line max-w-sm mx-auto">
      {items.map(({ href, label, kind }) => {
        const active = pathname === href || (href !== "/rooms" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-6 py-2 transition-colors ${
              active ? "text-pop-yellow" : "text-zinc-500"
            }`}
          >
            <Mascot kind={kind} size={22} tint={active ? "#FFD600" : "#737373"} />
            <span className="text-[10px] tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
