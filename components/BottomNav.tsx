"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, User } from "lucide-react";

const items = [
  { href: "/", label: "ホーム", Icon: Home },
  { href: "/post", label: "投稿", Icon: PlusSquare },
  { href: "/mypage", label: "マイページ", Icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-[var(--bg-elev)] border-t border-[var(--border)] max-w-sm mx-auto">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href;
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
