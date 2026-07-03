"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { UserDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";

type EngimonoName = "daruma" | "cat" | "tai" | "fuku" | "koban" | "mallet" | "mask";
const COLLECTED: EngimonoName[] = ["fuku", "cat", "tai"];

export default function MyPage() {
  const router = useRouter();
  const cachedNickname = typeof window !== "undefined" ? localStorage.getItem("ogiri_nickname") : null;
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [stats, setStats] = useState({ rooms: 0, zabuton: 0, taisho: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { router.push("/auth/login"); return; }

    setLoading(true);
    Promise.all([
      getDoc(doc(db, "users", user.uid)),
      getDocs(query(collection(db, "rooms"), where("memberIds", "array-contains", user.uid))),
    ]).then(([profileSnap, roomsSnap]) => {
      if (profileSnap.exists()) {
        setProfile({ id: user.uid, ...profileSnap.data() } as UserDoc);
      }
      setStats({ rooms: roomsSnap.size, zabuton: 87, taisho: 3 });
    }).finally(() => setLoading(false));
  }, [router]);

  const user = auth.currentUser;
  const nickname = profile?.nickname ?? cachedNickname ?? user?.displayName ?? "ゲスト";

  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[78px]">
      {/* Header */}
      <div style={{ padding: "4px 20px 24px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 24 }}>私の部屋</p>
          <button
            className="grid place-items-center bg-white"
            style={{ width: 38, height: 38, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
          >
            <Icon name="dots" size={18} color="#1A1714" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-[10px]">
          <div className="relative" style={{ width: 88, height: 88 }}>
            <div
              className="grid place-items-center"
              style={{ width: 88, height: 88, background: "#F0EBE0", border: "3px solid #2BA35F", borderRadius: "50%" }}
            >
              <Engimono name="fuku" width={48} height={52} />
            </div>
            <button
              className="absolute grid place-items-center"
              style={{ bottom: -2, right: -2, width: 28, height: 28, background: "#E5402F", border: "2px solid #FBF7EC", borderRadius: "50%" }}
            >
              <Icon name="pencil" size={12} color="#FBF7EC" strokeWidth={1.5} />
            </button>
          </div>
          <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 18 }}>{nickname}</p>
        </div>
      </div>

      {/* Stats */}
      <div
        className="mx-[20px] mb-[20px] bg-white flex"
        style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)", padding: "18px 8px", boxShadow: "0 2px 8px rgba(40,30,10,.04)" }}
      >
        <div className="flex-1 text-center" style={{ borderRight: "1px solid rgba(0,0,0,.05)" }}>
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 24 }}>{loading ? "…" : stats.rooms}</p>
          <p className="font-gothic font-semibold text-sub" style={{ fontSize: 10, marginTop: 2 }}>参加回数</p>
        </div>
        <div className="flex-1 text-center" style={{ borderRight: "1px solid rgba(0,0,0,.05)" }}>
          <p className="font-mincho font-extrabold" style={{ fontSize: 24, color: "#E5402F" }}>{loading ? "…" : stats.zabuton}</p>
          <p className="font-gothic font-semibold text-sub" style={{ fontSize: 10, marginTop: 2 }}>座布団</p>
        </div>
        <div className="flex-1 text-center">
          <p className="font-mincho font-extrabold" style={{ fontSize: 24, color: "#F4C422" }}>{loading ? "…" : stats.taisho}</p>
          <p className="font-gothic font-semibold text-sub" style={{ fontSize: 10, marginTop: 2 }}>大賞</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-[20px] flex-1 flex flex-col gap-[8px]">
        {/* Avatar collection */}
        <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 14, marginBottom: 4 }}>アバターコレクション</p>
        <div
          className="bg-white mb-[8px]"
          style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)", padding: 16 }}
        >
          <div className="flex gap-[12px] flex-wrap">
            {COLLECTED.map((name) => (
              <div
                key={name}
                className="grid place-items-center"
                style={{
                  width: 56, height: 56, background: "#F0EBE0", borderRadius: "50%",
                  border: name === COLLECTED[0] ? "2px solid #2BA35F" : "2px solid transparent",
                }}
              >
                <Engimono name={name} width={30} height={32} />
              </div>
            ))}
            <button
              className="grid place-items-center"
              style={{ width: 56, height: 56, background: "rgba(0,0,0,.02)", border: "2px dashed rgba(0,0,0,.12)", borderRadius: "50%" }}
            >
              <Icon name="plus" size={18} color="#B6AC97" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Settings menu */}
        <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 14, marginBottom: 4, marginTop: 8 }}>設定</p>
        <div
          className="bg-white overflow-hidden"
          style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)" }}
        >
          {["プロフィール編集", "対戦履歴", "通知設定"].map((label, i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between px-[16px] font-gothic font-semibold text-[#1A1714]"
              style={{
                padding: 16, fontSize: 14, cursor: "pointer",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,.04)" : "none",
              }}
            >
              <span>{label}</span>
              <Icon name="chevron" size={16} color="#B6AC97" strokeWidth={2} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
