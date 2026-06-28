"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import Mascot from "@/components/Mascot";
import type { UserDoc } from "@/lib/types";

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [stats, setStats] = useState({ rooms: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/auth/login"); return; }
      try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        if (profileSnap.exists()) {
          setProfile({ id: user.uid, ...profileSnap.data() } as UserDoc);
        }
        const roomsSnap = await getDocs(query(
          collection(db, "rooms"),
          where("memberIds", "array-contains", user.uid)
        ));
        setStats({ rooms: roomsSnap.size });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink">
        <div className="w-8 h-8 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin" />
      </div>
    );
  }

  const user = auth.currentUser;

  return (
    <div className="pb-24 px-4 pt-12">
      {/* Profile header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-pop-yellow/40" />
          ) : (
            <Mascot kind="char_yellow" size={48} />
          )}
          <div>
            <h1 className="text-white text-base font-bold">
              {profile?.nickname ?? user?.displayName ?? "ゲスト"}
            </h1>
            <p className="text-zinc-500 text-xs">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="text-zinc-500 active:scale-90 transition-transform">
          <Mascot kind="bolt" size={20} tint="#525252" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-surface border border-line rounded-2xl p-4 text-center animate-pop-in">
          <p className="font-display text-pop-yellow text-3xl">{stats.rooms}</p>
          <p className="text-zinc-500 text-xs mt-1">参加ルーム数</p>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-4 text-center animate-pop-in">
          <p className="text-3xl">😂</p>
          <p className="text-zinc-500 text-xs mt-1">笑いを届けた</p>
        </div>
      </div>

      {/* AI judges info */}
      <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
        <p className="text-xs text-zinc-500 tracking-wide">大喜利Pocketとは</p>
        <p className="text-white text-sm leading-relaxed">
          AIがあなたたちグループだけの笑いの傾向を学習します。<br />
          ゲームを重ねるほどお題の精度・AI講評の的確さが向上します。
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { mascot: "j_king" as const, label: "王道AI", color: "#FFD600" },
            { mascot: "j_sharp" as const, label: "辛口AI", color: "#FF4D6D" },
            { mascot: "j_chaos" as const, label: "カオスAI", color: "#BF5FFF" },
          ].map((p) => (
            <div key={p.label} className="bg-surface-2 rounded-xl py-3 space-y-1">
              <Mascot kind={p.mascot} size={32} className="mx-auto" />
              <p className="text-xs" style={{ color: p.color }}>{p.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
