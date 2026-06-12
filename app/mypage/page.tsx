"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import CapsuleCard from "@/components/CapsuleCard";
import { Eye, Archive, LogOut } from "lucide-react";
import type { CapsuleDoc, UserDoc } from "@/lib/types";

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [capsules, setCapsules] = useState<CapsuleDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/auth/login"); return; }

      const [profileSnap, capsulesSnap] = await Promise.all([
        getDoc(doc(db, "users", user.uid)),
        getDocs(query(
          collection(db, "capsules"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        )),
      ]);

      setProfile(profileSnap.exists() ? { id: user.uid, ...profileSnap.data() } as UserDoc : null);
      setCapsules(capsulesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as CapsuleDoc)));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/auth/login");
  };

  const totalViews = capsules.reduce((sum, c) => sum + (c.views ?? 0), 0);
  const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : null;

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-[#c48a9f] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="pb-24">
      <div className="px-4 pt-12 pb-4 border-b border-[#2d1e30] flex items-center justify-between">
        <div>
          <h1 className="text-[#ede0e8] text-base font-medium">{profile?.nickname ?? "マイページ"}</h1>
          {age && <p className="text-[#7a6475] text-xs mt-0.5">{age}歳・{profile?.gender}</p>}
        </div>
        <button onClick={handleSignOut} className="text-[#7a6475] hover:text-[#b899a8] transition-colors">
          <LogOut size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <div className="bg-[#1a1520] border border-[#2d1e30] rounded-xl p-4 text-center">
          <Archive size={18} className="text-[#c48a9f] mx-auto mb-1.5" />
          <p className="text-[#ede0e8] text-xl font-semibold">{capsules.length}</p>
          <p className="text-[#7a6475] text-[10px] mt-0.5">投稿数</p>
        </div>
        <div className="bg-[#1a1520] border border-[#2d1e30] rounded-xl p-4 text-center">
          <Eye size={18} className="text-[#c48a9f] mx-auto mb-1.5" />
          <p className="text-[#ede0e8] text-xl font-semibold">{totalViews.toLocaleString()}</p>
          <p className="text-[#7a6475] text-[10px] mt-0.5">開かれた回数</p>
        </div>
      </div>

      <div className="px-4">
        <p className="text-[#7a6475] text-[10px] tracking-widest uppercase mb-3">わたしのカプセル</p>
        {capsules.length === 0 ? (
          <p className="text-[#7a6475] text-sm text-center py-8">まだカプセルがありません</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {capsules.map((c) => <CapsuleCard key={c.id} capsule={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
