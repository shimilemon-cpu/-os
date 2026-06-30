"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
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
        <div className="w-8 h-8 rounded-full border-2 border-pop-red border-t-transparent animate-spin" />
      </div>
    );
  }

  const user = auth.currentUser;

  return (
    <div className="min-h-screen pb-24 px-5 pt-10 bg-ink">
      {/* Profile header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt=""
              className="w-12 h-12 rounded-full object-cover"
              style={{ border: "2px solid #E4DCCF" }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg text-[#FBF7EC]"
              style={{ background: "#E5402F" }}
            >
              {(profile?.nickname ?? user?.displayName ?? "G")[0]}
            </div>
          )}
          <div>
            <h1 className="text-text text-base font-bold">
              {profile?.nickname ?? user?.displayName ?? "ゲスト"}
            </h1>
            <p className="text-text-muted text-xs">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-text-muted text-xs font-bold px-3 py-1.5 rounded-full active:scale-90 transition-transform"
          style={{ border: "1px solid rgba(0,0,0,.1)" }}
        >
          ログアウト
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div
          className="bg-surface rounded-[18px] p-5 text-center animate-pop-in"
          style={{ border: "1px solid rgba(0,0,0,.07)" }}
        >
          <p className="font-display text-pop-red text-3xl font-bold">{stats.rooms}</p>
          <p className="text-text-muted text-xs mt-1">参加した寄合所</p>
        </div>
        <div
          className="bg-surface rounded-[18px] p-5 text-center animate-pop-in"
          style={{ border: "1px solid rgba(0,0,0,.07)" }}
        >
          <svg className="w-9 h-9 mx-auto mb-1">
            <use href="#c-koban" width="100%" height="100%"/>
          </svg>
          <p className="text-text-muted text-xs mt-1">座布団の記録</p>
        </div>
      </div>

      {/* About section */}
      <div
        className="bg-surface rounded-[20px] p-5 space-y-4 mb-6"
        style={{ border: "1px solid rgba(0,0,0,.07)" }}
      >
        <p className="text-xs text-text-muted font-bold tracking-wide">大喜利Pocketとは</p>
        <p className="text-text-sub text-sm leading-relaxed">
          AIがあなたたちグループだけの笑いの傾向を学習します。<br />
          ゲームを重ねるほどお題の精度・AI講評の的確さが向上します。
        </p>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          {[
            { label: "👑 王道AI", color: "#F4C422" },
            { label: "🔪 辛口AI", color: "#E5402F" },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-[14px] py-3 space-y-1"
              style={{ background: "#EBE2CF" }}
            >
              <p className="font-bold text-sm" style={{ color: p.color }}>{p.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charms row */}
      <div className="flex justify-center gap-5 opacity-50">
        {["#c-daruma", "#c-cat", "#c-tai", "#c-fuku"].map((id) => (
          <svg key={id} className="w-8 h-8">
            <use href={id} width="100%" height="100%"/>
          </svg>
        ))}
      </div>
    </div>
  );
}
