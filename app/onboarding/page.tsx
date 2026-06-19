"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { REGIONS, ENV_TYPES } from "@/lib/region";

const GENDERS = ["男性", "女性", "その他", "未回答"] as const;

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [envType, setEnvType] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      birthYear: birthYear ? parseInt(birthYear) : null,
      gender: gender || "未回答",
      region: region || null,
      envType: envType || null,
    });
    router.push("/");
  };

  const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 10 - i);

  const chipCls = (active: boolean) =>
    `py-2.5 px-3 rounded-xl text-xs border transition-colors text-center ${
      active
        ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
        : "border-[var(--border)] text-[var(--muted)]"
    }`;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12 bg-[var(--bg)]">
      {/* ステップインジケーター */}
      <div className="flex gap-1.5 mb-8 max-w-sm mx-auto w-full">
        {([1, 2, 3] as Step[]).map((n) => (
          <div
            key={n}
            className={`flex-1 h-1 rounded-full transition-colors ${
              step >= n ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">

        {step === 1 && (
          <>
            <div>
              <h1 className="text-[var(--text)] text-xl font-medium">はじめまして</h1>
              <p className="text-[var(--muted)] text-sm mt-1">
                あなたの情報を教えてください。<br />同世代のカプセルを届けるために使います。
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[var(--accent-2)] text-xs block mb-2">生まれた年</label>
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-sm focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">選択してください</option>
                  {years.map((y) => <option key={y} value={y}>{y}年生まれ</option>)}
                </select>
              </div>

              <div>
                <label className="text-[var(--accent-2)] text-xs block mb-2">性別</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDERS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={chipCls(gender === g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!birthYear}
              className="w-full bg-[var(--accent)] text-[var(--bg)] font-semibold py-4 rounded-2xl text-sm disabled:opacity-50"
            >
              次へ
            </button>
            <button onClick={() => router.push("/")} className="text-center text-[var(--muted)] text-xs">スキップ</button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h1 className="text-[var(--text)] text-xl font-medium">育った地域は？</h1>
              <p className="text-[var(--muted)] text-sm mt-1">
                記憶の風景をより正確に再現するために使います。<br />スキップもできます。
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-[var(--accent-2)] text-xs block mb-2">地域（都道府県のエリア）</label>
                <div className="grid grid-cols-2 gap-2">
                  {REGIONS.map((r) => (
                    <button key={r} onClick={() => setRegion(r === region ? "" : r)} className={chipCls(region === r)}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="text-[var(--muted)] text-sm px-4 py-3">戻る</button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[var(--accent)] text-[var(--bg)] font-semibold py-4 rounded-2xl text-sm"
              >
                次へ
              </button>
            </div>
            <button onClick={handleSave} className="text-center text-[var(--muted)] text-xs">
              スキップしてはじめる
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <h1 className="text-[var(--text)] text-xl font-medium">どんな景色の場所？</h1>
              <p className="text-[var(--muted)] text-sm mt-1">
                育った環境の景色タイプを選んでください。<br />思い出の画像生成に反映されます。
              </p>
            </div>

            <div>
              <div className="grid grid-cols-2 gap-2">
                {ENV_TYPES.map((e) => (
                  <button key={e} onClick={() => setEnvType(e === envType ? "" : e)} className={chipCls(envType === e)}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[var(--accent)] text-[var(--bg)] font-semibold py-4 rounded-2xl text-sm disabled:opacity-50"
            >
              {saving ? "保存中…" : "はじめる"}
            </button>
            <button onClick={() => setStep(2)} className="text-center text-[var(--muted)] text-xs">戻る</button>
          </>
        )}
      </div>
    </div>
  );
}
