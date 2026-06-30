"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeEngawa } from "@/lib/ogiri/engawa";
import type { EngawaPostDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";

const GENRE_COLORS: Record<string, string> = {
  日常: "#2BA35F", 恋愛: "#E5402F", 仕事: "#5BA9D6", カオス: "#F4C422", その他: "#B6AC97",
};

function PostCard({ post }: { post: EngawaPostDoc }) {
  const color = GENRE_COLORS[post.question.genre] ?? "#B6AC97";
  return (
    <Link
      href={`/engawa/${post.id}`}
      className="bg-white flex flex-col gap-[10px] active:scale-[0.98] transition-transform"
      style={{ borderRadius: 18, padding: "15px 16px", border: "1px solid rgba(0,0,0,.07)" }}
    >
      <div className="flex items-center gap-[8px]">
        <span
          className="font-gothic font-extrabold"
          style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: color + "20", color }}
        >
          {post.question.genre}
        </span>
        <span className="font-gothic text-sub" style={{ fontSize: 10 }}>{post.question.difficulty}</span>
      </div>
      <p className="font-mincho font-bold text-[#1A1714]" style={{ fontSize: 16, lineHeight: 1.5 }}>
        {post.question.text}
      </p>
      <div className="flex items-center gap-[6px]">
        <svg width="13" height="11" viewBox="0 0 30 24" aria-hidden="true">
          <path d="M5 6h20l3 6-3 6H5L2 12z" fill="#E5402F"/>
        </svg>
        <span className="font-gothic text-sub" style={{ fontSize: 11 }}>{post.answerCount}件の回答</span>
      </div>
    </Link>
  );
}

export default function EngawaPage() {
  const [posts, setPosts] = useState<EngawaPostDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeEngawa((p) => { setPosts(p); setLoading(false); });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[78px]">
      {/* AppBar */}
      <div className="px-[20px] pt-[6px] pb-[16px] flex items-center gap-[12px]">
        <Engimono name="tai" width={44} height={30} />
        <div className="flex-1">
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 21 }}>縁　側</p>
          <p className="font-gothic text-sub" style={{ fontSize: 11 }}>みんなのお題に回答しよう</p>
        </div>
      </div>

      {/* Posts */}
      <div className="flex-1 px-[20px] pb-[14px] flex flex-col gap-[11px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-red border-t-transparent animate-spin" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="text-center py-12">
            <Engimono name="tai" width={64} height={44} className="mx-auto mb-3 opacity-30" />
            <p className="font-gothic text-sub" style={{ fontSize: 14 }}>まだお題がありません</p>
            <p className="font-gothic text-sub" style={{ fontSize: 12, marginTop: 4 }}>ゲームをプレイしてお題を縁側に公開しよう</p>
          </div>
        )}
      </div>
    </div>
  );
}
