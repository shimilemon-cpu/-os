"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, PenLine } from "lucide-react";

const items = [
  { href: "/play", label: "ホーム", Icon: Home },
  { href: "/play/saved", label: "保存済み", Icon: Bookmark },
  { href: "/play/record", label: "記録する", Icon: PenLine },
];

export default function PlayBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-16 bg-white/95 backdrop-blur border-t border-[#ede4d8] max-w-sm mx-auto">
      {items.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/play" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 px-6 py-2 transition-colors ${
              active ? "text-[#ff5f3d]" : "text-[#8a7a70]"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] tracking-wide">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
