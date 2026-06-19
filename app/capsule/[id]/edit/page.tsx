"use client";

export const dynamic = "force-dynamic";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Loader2, CheckCircle, Trash2, Eye, EyeOff } from "lucide-react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { isAdmin } from "@/lib/admin";
import { searchMusic, type ItunesTrack } from "@/lib/itunes";
import type { CapsuleDoc } from "@/lib/types";

const GENDERS = ["男性", "女性", "その他", "未設定"];

export default function EditCapsulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [capsule, setCapsule] = useState<CapsuleDoc | null>(null);
  const [notFound, setNotFound] = useState(false);

  // 編集フィールド
  const [memoryText, setMemoryText] = useState("");
  const [memoryYear, setMemoryYear] = useState("");
  const [lifeStage, setLifeStage] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("未設定");
  const [birthYear, setBirthYear] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("published");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItunesTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "capsules", id));
      if (!snap.exists()) {
        setNotFound(true);
        return;
      }
      const c = { id: snap.id, ...snap.data() } as CapsuleDoc;
      setCapsule(c);
      setMemoryText(c.memoryText ?? "");
      setMemoryYear(c.memoryYear ? String(c.memoryYear) : "");
      setLifeStage(c.lifeStage ?? "");
      setNickname(c.userNickname ?? "");
      setGender(c.userGender ?? "未設定");
      setBirthYear(c.userBirthYear ? String(c.userBirthYear) : "");
      setSongTitle(c.songTitle ?? "");
      setArtistName(c.artistName ?? "");
      setPreviewUrl(c.previewUrl ?? null);
      setArtworkUrl(c.artworkUrl ?? null);
      setStatus(c.status ?? "published");
    };
    load();
  }, [id]);

  const admin = isAdmin(user);
  const canEdit = !!capsule && !!user && (admin || capsule.userId === user.uid);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults(await searchMusic(query));
    setSearching(false);
  };

  const selectTrack = (t: ItunesTrack) => {
    setSongTitle(t.trackName);
    setArtistName(t.artistName);
    setPreviewUrl(t.previewUrl ?? null);
    setArtworkUrl(t.artworkUrl100 ?? null);
    setSearchResults([]);
    setQuery("");
  };

  const handleSave = async () => {
    if (!capsule) return;
    setError("");
    setSaving(true);
    try {
      // 管理者以外が本文を編集した場合は、保存前にモデレーションを通す
      if (!admin && memoryText.trim() !== (capsule.memoryText ?? "").trim()) {
        const res = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: memoryText }),
        });
        const json = await res.json();
        if (!json.allowed) {
          setError(json.reason || "不適切な内容が含まれているため保存できません。");
          setSaving(false);
          return;
        }
      }

      await updateDoc(doc(db, "capsules", id), {
        memoryText,
        memoryYear: memoryYear ? parseInt(memoryYear) : null,
        lifeStage: lifeStage || null,
        userNickname: nickname || null,
        userGender: gender === "未設定" ? null : gender,
        userBirthYear: birthYear ? parseInt(birthYear) : null,
        songTitle: songTitle || null,
        artistName: artistName || null,
        previewUrl,
        artworkUrl,
        status,
      });
      router.push(`/capsule/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました。");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("このカプセルを完全に削除します。元に戻せません。よろしいですか？")) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "capsules", id));
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました。");
      setDeleting(false);
    }
  };

  // 読み込み中
  if (!authReady || (!capsule && !notFound)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-[var(--muted)] text-sm">カプセルが見つかりません</p>
        <Link href="/" className="text-[var(--accent)] text-sm">ホームへ戻る</Link>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 px-8 text-center">
        <p className="text-[var(--muted)] text-sm">このカプセルを編集する権限がありません。</p>
        <Link href={`/capsule/${id}`} className="text-[var(--accent)] text-sm">カプセルへ戻る</Link>
      </div>
    );
  }

  const labelCls = "text-[var(--accent-2)] text-xs block mb-1.5";
  const inputCls =
    "w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-sm placeholder-[var(--placeholder)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <div className="pb-28 min-h-screen">
      <div className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <Link href={`/capsule/${id}`} className="text-[var(--accent-2)]"><ArrowLeft size={20} /></Link>
          <span className="text-[var(--text)] text-sm font-medium">カプセルを編集</span>
          {admin && capsule && capsule.userId !== user?.uid && (
            <span className="ml-auto text-[10px] text-[var(--gold)] border border-[var(--gold)]/40 rounded-full px-2 py-0.5">管理者編集</span>
          )}
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* 公開状態 */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="flex items-center gap-2">
            {status === "published" ? <Eye size={16} className="text-[var(--ok)]" /> : <EyeOff size={16} className="text-[var(--danger)]" />}
            <span className="text-[var(--text)] text-sm">{status === "published" ? "公開中" : "非表示"}</span>
          </div>
          <button
            onClick={() => setStatus((s) => (s === "published" ? "hidden" : "published"))}
            className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--accent-2)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            {status === "published" ? "非表示にする" : "公開する"}
          </button>
        </div>

        <div>
          <label className={labelCls}>記憶（100文字以内）</label>
          <textarea
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value.slice(0, 100))}
            rows={4}
            className={`${inputCls} resize-none leading-relaxed`}
          />
          <p className="text-right text-[var(--muted)] text-xs mt-1">{memoryText.length} / 100</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>年</label>
            <input type="number" value={memoryYear} onChange={(e) => setMemoryYear(e.target.value)} placeholder="2008" min={1950} max={2030} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>そのときの自分</label>
            <input type="text" value={lifeStage} onChange={(e) => setLifeStage(e.target.value)} placeholder="高校3年の夏" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className={labelCls}>ニックネーム</label>
            <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-1">
            <label className={labelCls}>性別</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="col-span-1">
            <label className={labelCls}>生まれ年</label>
            <input type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="1990" min={1930} max={2025} className={inputCls} />
          </div>
        </div>

        {/* 楽曲 */}
        <div className="space-y-2">
          <label className={labelCls}>楽曲</label>
          {songTitle && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--accent)]/40">
              {artworkUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artworkUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)]" />}
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text)] text-sm font-medium truncate">{songTitle}</p>
                <p className="text-[var(--muted)] text-xs truncate">{artistName}</p>
              </div>
              <CheckCircle size={16} className="text-[var(--accent)] shrink-0" />
            </div>
          )}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="曲を変える場合は検索"
              className={`${inputCls} pr-12`}
            />
            <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--accent)]">
              {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {searchResults.map((t) => (
                <button key={t.trackId} onClick={() => selectTrack(t)} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-colors text-left">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.artworkUrl100} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text)] text-xs font-medium truncate">{t.trackName}</p>
                    <p className="text-[var(--muted)] text-[10px] truncate">{t.artistName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-[var(--danger)] text-xs leading-relaxed bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl p-3">{error}</p>
        )}

        <button onClick={handleSave} disabled={saving || deleting} className="w-full bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold py-3.5 rounded-full disabled:opacity-50">
          {saving ? "保存中…" : "保存する"}
        </button>

        <button onClick={handleDelete} disabled={saving || deleting} className="w-full flex items-center justify-center gap-2 text-[var(--danger)] text-sm py-2 disabled:opacity-50">
          <Trash2 size={15} />
          {deleting ? "削除中…" : "このカプセルを削除する"}
        </button>
      </div>
    </div>
  );
}
