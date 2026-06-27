"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { LogOut } from "lucide-react";
import type { UserDoc } from "@/lib/types";

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [stats, setStats] = useState({ rooms: 0, votes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/auth/login"); return; }
      try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        if (profileSnap.exists()) {
          setProfile({ id: user.uid, ...profileSnap.data() } as UserDoc);
        }
        // Count rooms
        const roomsSnap = await getDocs(query(
          collection(db, "rooms"),
          where("memberIds", "array-contains", user.uid)
        ));
        setStats({ rooms: roomsSnap.size, votes: 0 });
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
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const user = auth.currentUser;

  return (
    <div className="pb-24 px-4 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {user?.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="w-12 h-12 rounded-full object-cover" />
          )}
          <div>
            <h1 className="text-[var(--text)] text-base font-medium">
              {profile?.nickname ?? user?.displayName ?? "ゲスト"}
            </h1>
            <p className="text-[var(--muted)] text-xs">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="text-[var(--muted)]">
          <LogOut size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center">
          <p className="text-[var(--accent)] text-2xl font-bold">{stats.rooms}</p>
          <p className="text-[var(--muted)] text-xs mt-1">参加ルーム数</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center">
          <p className="text-[var(--accent)] text-2xl font-bold">😂</p>
          <p className="text-[var(--muted)] text-xs mt-1">笑いを届けた</p>
        </div>
      </div>

      {/* テーマ */}
      <div className="mb-8">
        <p className="text-xs text-[var(--muted)] tracking-wide mb-3">テーマ</p>
        <ThemeSwitcher />
      </div>

      {/* Info */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
        <p className="text-xs text-[var(--muted)] tracking-wide">大喜利Pocketとは</p>
        <p className="text-[var(--text)] text-sm leading-relaxed">
          AIがあなたたちグループだけの笑いの傾向を学習します。<br />
          ゲームを重ねるほどお題の精度・AI講評の的確さが向上します。
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { emoji: "👑", label: "王道AI" },
            { emoji: "🔪", label: "辛口AI" },
            { emoji: "🌀", label: "カオスAI" },
          ].map((p) => (
            <div key={p.label} className="bg-[var(--bg)] rounded-xl py-2">
              <p className="text-base">{p.emoji}</p>
              <p className="text-[var(--muted)] mt-0.5">{p.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
