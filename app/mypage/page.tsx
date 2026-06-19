"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc, getDoc, setDoc, collection, query, where, orderBy, limit, getDocs,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { isAdmin } from "@/lib/admin";
import { REGIONS, ENV_TYPES } from "@/lib/region";
import CapsuleCard from "@/components/CapsuleCard";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { Eye, EyeOff, Archive, LogOut, ShieldCheck, Pencil, AlertTriangle, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import type { CapsuleDoc, UserDoc } from "@/lib/types";

type AdminFilter = "all" | "published" | "hidden";

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserDoc | null>(null);
  const [capsules, setCapsules] = useState<CapsuleDoc[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<AdminFilter>("all");
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionEdit, setRegionEdit] = useState("");
  const [envEdit, setEnvEdit] = useState("");
  const [savingRegion, setSavingRegion] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/auth/login"); return; }
      const amAdmin = isAdmin(user);
      setAdmin(amAdmin);
      try {
        const profileSnap = await getDoc(doc(db, "users", user.uid));
        const p = profileSnap.exists() ? { id: user.uid, ...profileSnap.data() } as UserDoc : null;
        setProfile(p);
        setRegionEdit(p?.region ?? "");
        setEnvEdit(p?.envType ?? "");

        if (amAdmin) {
          // 管理者：全ユーザーの最近のカプセルを取得（単一フィールド並び替え＝索引不要）
          const snap = await getDocs(query(
            collection(db, "capsules"),
            orderBy("createdAt", "desc"),
            limit(100),
          ));
          setCapsules(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CapsuleDoc)));
        } else {
          // 一般ユーザー：自分の投稿のみ（複合索引を避けるため並び替えはクライアント側）
          const snap = await getDocs(query(
            collection(db, "capsules"),
            where("userId", "==", user.uid),
          ));
          const mine = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as CapsuleDoc))
            .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
          setCapsules(mine);
        }
      } catch (e) {
        console.error("マイページ読み込み失敗:", e);
        setError("データの読み込みに失敗しました。時間をおいて再度お試しください。");
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

  const saveRegion = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSavingRegion(true);
    try {
      await setDoc(doc(db, "users", user.uid), { region: regionEdit || null, envType: envEdit || null }, { merge: true });
      setProfile((p) => p ? { ...p, region: regionEdit || null, envType: envEdit || null } : p);
      setRegionOpen(false);
    } catch {
      // 保存エラーはサイレントに無視
    } finally {
      setSavingRegion(false);
    }
  };

  const totalViews = capsules.reduce((sum, c) => sum + (c.views ?? 0), 0);
  const hiddenCount = capsules.filter((c) => c.status !== "published").length;
  const age = profile?.birthYear ? new Date().getFullYear() - profile.birthYear : null;

  const adminVisible = capsules.filter((c) =>
    filter === "all" ? true
    : filter === "published" ? c.status === "published"
    : c.status !== "published"
  );

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="pb-24">
      {/* ヘッダー */}
      <div className="px-4 pt-12 pb-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[var(--text)] text-base font-medium truncate">{profile?.nickname ?? "マイページ"}</h1>
            {admin && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--gold)] border border-[var(--gold)]/40 rounded-full px-2 py-0.5 shrink-0">
                <ShieldCheck size={11} />管理者
              </span>
            )}
          </div>
          {age && <p className="text-[var(--muted)] text-xs mt-0.5">{age}歳・{profile?.gender}</p>}
        </div>
        <button onClick={handleSignOut} className="text-[var(--muted)] hover:text-[var(--accent-2)] transition-colors shrink-0">
          <LogOut size={18} />
        </button>
      </div>

      {error && (
        <p className="mx-4 mt-4 text-[var(--danger)] text-xs bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl p-3">{error}</p>
      )}

      {/* テーマ切替 */}
      <div className="px-4 pt-5">
        <ThemeSwitcher />
      </div>

      {admin ? (
        /* ===== 管理者ビュー ===== */
        <>
          <div className="grid grid-cols-3 gap-3 p-4">
            <StatCard icon={<Archive size={16} className="text-[var(--accent)]" />} value={capsules.length} label="全カプセル" />
            <StatCard icon={<Eye size={16} className="text-[var(--accent)]" />} value={totalViews.toLocaleString()} label="総閲覧" />
            <StatCard icon={<EyeOff size={16} className="text-[var(--danger)]" />} value={hiddenCount} label="非表示" />
          </div>

          <div className="px-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[var(--muted)] text-[10px] tracking-widest uppercase">投稿の管理</p>
              <div className="flex gap-1.5 ml-auto">
                {([["all", "すべて"], ["published", "公開"], ["hidden", "非表示"]] as [AdminFilter, string][]).map(([f, label]) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      filter === f ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {adminVisible.length === 0 ? (
              <p className="text-[var(--muted)] text-sm text-center py-8">該当する投稿がありません</p>
            ) : (
              <div className="space-y-2">
                {adminVisible.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                    {c.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] shrink-0" />}
                    <Link href={`/capsule/${c.id}`} className="flex-1 min-w-0">
                      <p className="text-[var(--text)] text-xs font-medium truncate">{c.memoryText}</p>
                      <p className="text-[var(--muted)] text-[10px] truncate">
                        {c.userNickname ?? "—"}・{c.songTitle ?? ""}
                      </p>
                    </Link>
                    {c.status !== "published" && (
                      <span className="flex items-center gap-0.5 text-[9px] text-[var(--danger)] border border-[var(--danger)]/40 rounded-full px-1.5 py-0.5 shrink-0">
                        <AlertTriangle size={9} />非表示
                      </span>
                    )}
                    <Link href={`/capsule/${c.id}/edit`} className="text-[var(--accent-2)] hover:text-[var(--accent)] transition-colors shrink-0 p-1">
                      <Pencil size={15} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ===== 一般ユーザービュー ===== */
        <>
          <div className="grid grid-cols-2 gap-3 p-4">
            <StatCard icon={<Archive size={18} className="text-[var(--accent)]" />} value={capsules.length} label="投稿数" big />
            <StatCard icon={<Eye size={18} className="text-[var(--accent)]" />} value={totalViews.toLocaleString()} label="開かれた回数" big />
          </div>

          {/* 地域プロフィール — 画像生成に使われる */}
          <div className="px-4 mb-5">
            <button
              onClick={() => setRegionOpen((o) => !o)}
              className="w-full flex items-center gap-2 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]"
            >
              <MapPin size={14} className="text-[var(--accent)] shrink-0" />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[var(--text)] text-xs font-medium">
                  {profile?.region || profile?.envType
                    ? [profile.region, profile.envType].filter(Boolean).join("・")
                    : "育ったエリアを設定"}
                </p>
                <p className="text-[var(--muted)] text-[10px]">画像の背景シーンに反映されます</p>
              </div>
              {regionOpen ? <ChevronUp size={14} className="text-[var(--muted)]" /> : <ChevronDown size={14} className="text-[var(--muted)]" />}
            </button>

            {regionOpen && (
              <div className="mt-2 p-4 rounded-xl bg-[var(--bg-elev)] border border-[var(--border)] space-y-4">
                <div>
                  <p className="text-[var(--accent-2)] text-[10px] mb-2">地域</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {REGIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRegionEdit(r === regionEdit ? "" : r)}
                        className={`text-[11px] py-2 px-2 rounded-lg border text-left transition-colors ${
                          regionEdit === r
                            ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-[var(--border)] text-[var(--muted)]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[var(--accent-2)] text-[10px] mb-2">景色タイプ</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ENV_TYPES.map((e) => (
                      <button
                        key={e}
                        onClick={() => setEnvEdit(e === envEdit ? "" : e)}
                        className={`text-[11px] py-2 px-2 rounded-lg border text-left transition-colors ${
                          envEdit === e
                            ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                            : "border-[var(--border)] text-[var(--muted)]"
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={saveRegion}
                  disabled={savingRegion}
                  className="w-full bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold py-2.5 rounded-full disabled:opacity-50"
                >
                  {savingRegion ? "保存中…" : "保存する"}
                </button>
              </div>
            )}
          </div>

          <div className="px-4">
            <p className="text-[var(--muted)] text-[10px] tracking-widest uppercase mb-3">わたしのカプセル</p>
            {capsules.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-[var(--muted)] text-sm">まだカプセルがありません</p>
                <Link href="/post" className="inline-block bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold px-6 py-2.5 rounded-full">
                  最初の記憶を残す
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {capsules.map((c) => (
                  <div key={c.id} className="relative">
                    {c.status !== "published" && (
                      <span className="absolute top-2 left-2 z-10 flex items-center gap-0.5 text-[9px] text-[var(--danger)] bg-[var(--bg)]/80 border border-[var(--danger)]/40 rounded-full px-1.5 py-0.5">
                        <EyeOff size={9} />非表示
                      </span>
                    )}
                    <CapsuleCard capsule={c} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, big }: { icon: React.ReactNode; value: number | string; label: string; big?: boolean }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-center">
      <div className="mx-auto mb-1.5 w-fit">{icon}</div>
      <p className={`text-[var(--text)] font-semibold ${big ? "text-xl" : "text-lg"}`}>{value}</p>
      <p className="text-[var(--muted)] text-[10px] mt-0.5">{label}</p>
    </div>
  );
}
