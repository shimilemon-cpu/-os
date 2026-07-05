import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "大喜利Pocketに招待されました",
  description: "リンクを開いて大喜利に参加しよう！",
  openGraph: {
    title: "大喜利Pocketに招待されました",
    description: "リンクを開いて大喜利に参加しよう！",
    type: "website",
  },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
