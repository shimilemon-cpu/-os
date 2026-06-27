"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, User } from "lucide-react";

const items = [
  { href: "/rooms", label: "ルーム", Icon: Home },
  { href: "/rooms/new", label: "作成", Icon: Plus },
  { href: "/mypage", label: "マイページ", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.includes("/game") || pathname.includes("/summary")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-[var(--bg-elev)] border-t border-[var(--border)] max-w-sm mx-auto">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/rooms" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-6 py-2 transition-colors ${
              active ? "text-[var(--accent)]" : "text-[var(--muted)]"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2 : 1.5} />
            <span className="text-[10px] tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
