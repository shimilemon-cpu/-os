"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeEngawa } from "@/lib/ogiri/engawa";
import type { EngawaPostDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";

const FILTERS = ["すべて", "お気に入り", "話題"] as const;

function ZabutonButton({ count, liked }: { count: number; liked?: boolean }) {
  return (
    <div
      className="flex items-center gap-[5px] font-gothic font-extrabold"
      style={{
        padding: "6px 14px", borderRadius: 999, cursor: "pointer",
        ...(liked
          ? { background: "#E5402F", color: "#fff" }
          : { background: "rgba(229,64,47,.06)", border: "1px solid rgba(229,64,47,.12)", color: "#E5402F" }),
      }}
    >
      <svg width="16" height="10" viewBox="0 0 20 12" fill="none">
        {liked ? (
          <>
            <rect x="1" y="3" width="18" height="8" rx="2" fill="#fff" opacity="0.9" />
            <rect x="3" y="1" width="14" height="4" rx="1.5" fill="rgba(255,255,255,.7)" />
          </>
        ) : (
          <>
            <rect x="1" y="3" width="18" height="8" rx="2" fill="#E5402F" opacity="0.8" />
            <rect x="3" y="1" width="14" height="4" rx="1.5" fill="#C54B3E" />
          </>
        )}
      </svg>
      <span style={{ fontSize: 12 }}>{count}</span>
    </div>
  );
}

function PostCard({ post }: { post: EngawaPostDoc }) {
  return (
    <Link
      href={`/engawa/${post.id}`}
      className="bg-white active:scale-[0.98] transition-transform"
      style={{ borderRadius: 18, padding: 18, border: "1px solid rgba(0,0,0,.07)", boxShadow: "0 2px 8px rgba(40,30,10,.04)" }}
    >
      <div style={{ background: "#F5F1E8", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
        <p className="font-gothic font-extrabold text-sub" style={{ fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>お題</p>
        <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 15, lineHeight: 1.5 }}>
          {post.question.text}
        </p>
      </div>
      <p className="font-gothic text-[#1A1714]" style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.6, marginBottom: 14 }}>
        {post.topAnswer ?? `${post.answerCount}件の回答`}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <div className="grid place-items-center" style={{ width: 26, height: 26, background: "#F0EBE0", borderRadius: "50%" }}>
            <Engimono name="fuku" width={15} height={16} />
          </div>
          <span className="font-gothic font-semibold text-sub" style={{ fontSize: 11 }}>{post.authorName ?? "匿名"}</span>
          <span className="font-gothic text-sub2" style={{ fontSize: 10 }}>{post.timeAgo ?? ""}</span>
        </div>
        <ZabutonButton count={post.answerCount} />
      </div>
    </Link>
  );
}

export default function EngawaPage() {
  const [posts, setPosts] = useState<EngawaPostDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0);

  useEffect(() => {
    const unsub = subscribeEngawa((p) => { setPosts(p); setLoading(false); });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[78px]">
      {/* Header */}
      <div style={{ padding: "4px 20px 16px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 24 }}>縁側</p>
          <button
            className="grid place-items-center bg-white"
            style={{ width: 38, height: 38, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
          >
            <Icon name="search" size={18} color="#1A1714" strokeWidth={2.2} />
          </button>
        </div>
        {/* Filter chips */}
        <div className="flex gap-[8px]">
          {FILTERS.map((label, i) => (
            <button
              key={label}
              onClick={() => setFilter(i)}
              className="font-gothic font-bold"
              style={{
                fontSize: 12, padding: "8px 16px", borderRadius: 999,
                background: filter === i ? "#1A1714" : "#ffffff",
                color: filter === i ? "#FBF7EC" : "#7A6F5C",
                fontWeight: filter === i ? 700 : 600,
                border: filter === i ? "none" : "1px solid rgba(0,0,0,.07)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 px-[20px] pb-[14px] flex flex-col gap-[12px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-red border-t-transparent animate-spin" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div
            className="text-center py-8 mt-2 flex flex-col items-center"
            style={{ borderRadius: 20, border: "1.5px dashed rgba(0,0,0,.12)", background: "rgba(255,255,255,.4)" }}
          >
            <Engimono name="tai" width={54} height={60} className="mb-2" style={{ opacity: 0.35 }} />
            <p className="font-mincho font-extrabold text-[#1A1714] mb-1" style={{ fontSize: 15 }}>まだ投稿がありません</p>
            <p className="font-gothic text-sub" style={{ fontSize: 11 }}>ゲームをプレイしてお題を縁側に公開しよう</p>
          </div>
        )}
      </div>
    </div>
  );
}
