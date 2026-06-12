"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";

const GENDERS = ["男性", "女性", "その他", "未回答"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      birthYear: birthYear ? parseInt(birthYear) : null,
      gender: gender || "未回答",
    });
    router.push("/");
  };

  const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 10 - i);

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-[#0e0b0e]">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        <div>
          <h1 className="text-[#ede0e8] text-xl font-medium">はじめまして</h1>
          <p className="text-[#7a6475] text-sm mt-1">
            あなたの情報を教えてください。<br />同世代のカプセルを届けるために使います。
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-[#b899a8] text-xs block mb-2">生まれた年</label>
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="w-full bg-[#1a1520] border border-[#2d1e30] rounded-xl px-4 py-3 text-[#ede0e8] text-sm focus:outline-none focus:border-[#c48a9f]"
            >
              <option value="">選択してください</option>
              {years.map((y) => <option key={y} value={y}>{y}年生まれ</option>)}
            </select>
          </div>

          <div>
            <label className="text-[#b899a8] text-xs block mb-2">性別</label>
            <div className="grid grid-cols-2 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`py-3 rounded-xl text-sm border transition-colors ${
                    gender === g ? "border-[#c48a9f] text-[#c48a9f] bg-[#c48a9f]/10" : "border-[#2d1e30] text-[#7a6475]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#c48a9f] text-[#0e0b0e] font-semibold py-4 rounded-2xl text-sm disabled:opacity-50"
        >
          {saving ? "保存中…" : "はじめる"}
        </button>

        <button onClick={() => router.push("/")} className="text-center text-[#7a6475] text-xs">
          スキップ
        </button>
      </div>
    </div>
  );
}
