"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

const ITEMS = [
  { href: "/rooms",     label: "寄合所", icon: "home"    as const },
  { href: "/topics",   label: "お題",   icon: "grid"    as const },
  { href: "/banzuke",  label: "番付",   icon: "banzuke" as const },
  { href: "/mypage",   label: "自分",   icon: "person"  as const },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname.includes("/game") || pathname.includes("/summary") || pathname === "/") return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-around max-w-sm mx-auto"
      style={{ height: 78, background: "#ffffff", borderTop: "1px solid rgba(0,0,0,.07)", paddingTop: 12 }}
    >
      {ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== "/rooms" && href !== "/" && pathname.startsWith(href));
        const color = active ? "#2BA35F" : "#B6AC97";
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-[5px] font-gothic"
            style={{
              fontSize: 10.5,
              fontWeight: active ? 800 : 700,
              color,
              flex: 1,
              alignItems: "center",
            }}
          >
            <Icon name={icon} size={23} color={color} strokeWidth={2.1} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
