"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import type { UserDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";

type EngimonoName = "daruma" | "cat" | "tai" | "fuku" | "koban" | "mallet" | "mask";
const COLLECTION: EngimonoName[] = ["daruma", "cat", "tai", "fuku", "koban", "mallet"];
const COLLECTED: EngimonoName[] = ["daruma", "cat", "tai", "fuku"];

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2"/>
      <path d="M8 11V8a4 4 0 0 1 8 0v3"/>
    </svg>
  );
}

export default function MyPage() {
  const router = useRouter();
  const cachedNickname = typeof window !== "undefined" ? localStorage.getItem("ogiri_nickname") : null;
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [stats, setStats] = useState({ rooms: 0, zabuton: 0, yokozuna: 0 });
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState(true);

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
      setStats({ rooms: roomsSnap.size, zabuton: 238, yokozuna: 14 });
    }).finally(() => setLoading(false));
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  const user = auth.currentUser;
  const nickname = profile?.nickname ?? cachedNickname ?? user?.displayName ?? "ゲスト";
  const handle = `＠${(user?.displayName ?? "user").toLowerCase().replace(/\s/g, "_")}`;

  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[78px]">
      <div className="flex-1 px-[20px] pb-[14px] pt-[14px] flex flex-col gap-[16px]">

        {/* プロフィール頭 */}
        <div className="flex items-center gap-[15px]">
          <div className="shrink-0 grid place-items-center" style={{ width: 74, height: 74, borderRadius: 24, background: "#FFF3D6" }}>
            <Engimono name="fuku" width={58} height={64} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 22 }}>{nickname}</p>
            <p className="font-gothic text-sub" style={{ fontSize: 12 }}>{handle}</p>
            <span
              className="inline-block font-gothic font-extrabold text-paper mt-[7px]"
              style={{ fontSize: 11, padding: "3px 10px", borderRadius: 999, background: "#E5402F" }}
            >
              称号・あるあるの達人
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="font-gothic text-sub shrink-0"
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,.1)" }}
          >
            ログアウト
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-[10px]">
          {[
            { value: loading ? "..." : stats.zabuton, label: "獲得座布団", color: "#E5402F" },
            { value: loading ? "..." : stats.yokozuna, label: "横綱の回数", color: "#2BA35F" },
            { value: loading ? "..." : stats.rooms, label: "参加部屋", color: "#E0A93B" },
          ].map(({ value, label, color }) => (
            <div
              key={label}
              className="flex-1 bg-white text-center"
              style={{ borderRadius: 16, padding: 13, border: "1px solid rgba(0,0,0,.07)" }}
            >
              <p className="font-mincho font-extrabold" style={{ fontSize: 23, color }}>{value}</p>
              <p className="font-gothic text-sub mt-[2px]" style={{ fontSize: 11 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* コレクション */}
        <div>
          <p className="font-gothic font-extrabold text-[#1A1714] mb-3" style={{ fontSize: 14 }}>
            縁起物コレクション <span className="text-sub2" style={{ fontSize: 13 }}>{COLLECTED.length} / {COLLECTION.length}</span>
          </p>
          <div className="grid gap-[8px]" style={{ gridTemplateColumns: `repeat(${COLLECTION.length}, 1fr)` }}>
            {COLLECTION.map((name) => {
              const owned = COLLECTED.includes(name);
              return owned ? (
                <div
                  key={name}
                  className="bg-white grid place-items-center aspect-square"
                  style={{ borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
                >
                  <Engimono name={name} width={32} height={36} />
                </div>
              ) : (
                <div
                  key={name}
                  className="grid place-items-center aspect-square text-[#C3B99F]"
                  style={{ borderRadius: 13, background: "#EFE8DA" }}
                >
                  <LockIcon />
                </div>
              );
            })}
          </div>
        </div>

        {/* 設定リスト */}
        <div className="bg-white overflow-hidden" style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,.07)" }}>
          {[
            { label: "表示名・アバター", right: <span className="font-gothic text-sub2" style={{ fontSize: 13 }}>›</span> },
            {
              label: "通知",
              right: (
                <button
                  onClick={() => setNotifications((v) => !v)}
                  className="relative"
                  style={{ width: 46, height: 27, borderRadius: 999, background: notifications ? "#2BA35F" : "#E4DCCF" }}
                >
                  <span
                    className="absolute top-[3px] bg-white rounded-full"
                    style={{ width: 21, height: 21, right: notifications ? 3 : undefined, left: notifications ? undefined : 3 }}
                  />
                </button>
              ),
            },
            {
              label: "テーマ",
              right: <span className="font-gothic text-sub" style={{ fontSize: 13 }}>めでたポップ ›</span>,
            },
          ].map(({ label, right }, i, arr) => (
            <div
              key={label}
              className="flex items-center justify-between px-[16px] font-gothic font-bold text-[#1A1714]"
              style={{
                padding: "14px 16px", fontSize: 14,
                borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,.07)" : "none",
              }}
            >
              <span>{label}</span>
              {right}
            </div>
          ))}
        </div>

        {/* AD placeholder */}
        <div
          className="flex items-center justify-center font-gothic text-sub"
          style={{ height: 60, borderRadius: 12, border: "1.5px dashed rgba(0,0,0,.12)", fontSize: 12 }}
        >
          AD
        </div>
      </div>
    </div>
  );
}
