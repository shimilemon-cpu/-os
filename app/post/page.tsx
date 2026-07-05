"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Music, CheckCircle, Loader2, ExternalLink, ChevronDown, ChevronUp, X } from "lucide-react";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/client";
import { buildRegionContext } from "@/lib/region";
import { searchMusic, extractYoutubeId, type ItunesTrack } from "@/lib/itunes";
import type { UserDoc } from "@/lib/types";

type Step = 1 | 2 | 3 | 4 | 5;
const STEP_LABELS = ["記憶", "年代", "楽曲", "画像生成", "完成"];
const DRAFT_KEY = "capsule_post_draft";

interface PostData {
  memoryText: string;
  memoryYear: string;
  lifeStage: string;
  track: ItunesTrack | null;
  youtubeUrl: string;
  youtubeStart: string;
  images: string[];
}

const EMPTY: PostData = { memoryText: "", memoryYear: "", lifeStage: "", track: null, youtubeUrl: "", youtubeStart: "", images: [] };

// "1:30" や "90" を秒数に変換
function parseStartSeconds(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  if (s.includes(":")) {
    const [m, sec] = s.split(":");
    const total = parseInt(m || "0") * 60 + parseInt(sec || "0");
    return isNaN(total) ? null : total;
  }
  const n = parseInt(s);
  return isNaN(n) ? null : n;
}

export default function PostPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<PostData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItunesTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genPhase, setGenPhase] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [moderationError, setModerationError] = useState("");
  const [userProfile, setUserProfile] = useState<UserDoc | null>(null);
  const [ytOpen, setYtOpen] = useState(false);

  // 下書きを復元（ページを離れて戻ってきても続きから書ける）
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { data?: PostData; step?: Step };
        if (saved.data) setData({ ...EMPTY, ...saved.data });
        // 生成途中(step4)は復元しても再生成が必要なので楽曲ステップに戻す
        if (saved.step) setStep(saved.step === 4 ? 3 : saved.step);
      }
    } catch {
      // 壊れた下書きは無視
    }
    setHydrated(true);
  }, []);

  // 変更のたびに下書きを保存
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step }));
    } catch {
      // 保存できなくても投稿フローは止めない
    }
  }, [data, step, hydrated]);

  // 投稿者のプロフィール（ニックネーム・年齢・性別・地域）を取得する
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setUserProfile({ id: user.uid, ...snap.data() } as UserDoc);
      } catch {
        // プロフィール取得に失敗しても投稿フローは止めない
      }
    });
    return () => unsub();
  }, []);

  // 記憶テキストを公開して問題ないかチェックしてから次へ進む
  const handleNextFromStep1 = async () => {
    setModerationError("");
    setModerating(true);
    try {
      const res = await fetch("/api/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.memoryText }),
      });
      const json = await res.json();
      if (!json.allowed) {
        setModerationError(
          json.reason
            ? `この内容は投稿できません（${json.reason}）。別の言葉で書き直すと投稿できます。`
            : "この内容は投稿できません。表現を見直してください。"
        );
        return;
      }
      setStep(2);
    } catch {
      // チェックに失敗したら進行は止めない
      setStep(2);
    } finally {
      setModerating(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults(await searchMusic(query));
    setSearching(false);
  };

  const handleGenerateImages = async () => {
    setGenerating(true);
    setGenProgress(5);
    setGenPhase("記憶からシーンを考えています…");

    // 実際の1枚ごとの進捗は取れないので、体感の進捗バーを疑似的に進める
    let p = 5;
    const timer = setInterval(() => {
      p = Math.min(92, p + Math.max(1, Math.round((92 - p) * 0.07)));
      setGenProgress(p);
      if (p < 22) setGenPhase("記憶からシーンを考えています…");
      else if (p < 45) setGenPhase("1〜2枚目を描いています…");
      else if (p < 68) setGenPhase("3枚目を描いています…");
      else if (p < 86) setGenPhase("4枚目を描いています…");
      else setGenPhase("色合いを仕上げています…");
    }, 600);

    try {
      const userRegion = buildRegionContext(userProfile?.region, userProfile?.envType);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryText: data.memoryText, memoryYear: data.memoryYear, lifeStage: data.lifeStage, userRegion }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "画像生成に失敗しました");
      setGenProgress(100);
      setGenPhase("完成しました");
      setData((d) => ({ ...d, images: json.images }));
      setStep(5);
    } catch (e) {
      alert(e instanceof Error ? e.message : "画像生成に失敗しました。もう一度お試しください。");
    } finally {
      clearInterval(timer);
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      const videoId = extractYoutubeId(data.youtubeUrl);
      await addDoc(collection(db, "capsules"), {
        userId: user.uid,
        userNickname: userProfile?.nickname ?? user.displayName ?? null,
        userBirthYear: userProfile?.birthYear ?? null,
        userGender: userProfile?.gender ?? null,
        memoryText: data.memoryText,
        memoryYear: data.memoryYear ? parseInt(data.memoryYear) : null,
        lifeStage: data.lifeStage,
        youtubeVideoId: videoId,
        youtubeStart: parseStartSeconds(data.youtubeStart),
        songTitle: data.track?.trackName ?? null,
        artistName: data.track?.artistName ?? null,
        previewUrl: data.track?.previewUrl ?? null,
        artworkUrl: data.track?.artworkUrl100 ?? null,
        images: data.images,
        views: 0,
        status: "published",
        createdAt: serverTimestamp(),
      });
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* noop */ }
      router.push("/");
    } catch {
      alert("投稿に失敗しました。");
    } finally {
      setPublishing(false);
    }
  };

  const videoId = extractYoutubeId(data.youtubeUrl);

  return (
    <div className="pb-24 min-h-screen">
      <div className="sticky top-0 z-40 bg-[var(--bg)]/90 backdrop-blur border-b border-[var(--border)]">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <Link href="/" className="text-[var(--accent-2)]"><ArrowLeft size={20} /></Link>
          <span className="text-[var(--text)] text-sm font-medium">タイムカプセルを作る</span>
        </div>
        <div className="flex px-4 pb-3 gap-1.5">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = step > n; const active = step === n;
            return (
              <div key={n} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full transition-colors ${done || active ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`} />
                <span className={`text-[9px] tracking-wide ${active ? "text-[var(--accent)]" : done ? "text-[var(--accent-2)]" : "text-[var(--border)]"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[var(--text)] text-base font-medium mb-1">あの日の記憶を書いてください</h2>
              <p className="text-[var(--muted)] text-xs">100文字以内・場所（海、実家、渋谷など）を書くと画像に反映されます</p>
            </div>
            <textarea value={data.memoryText} onChange={(e) => { setData((d) => ({ ...d, memoryText: e.target.value.slice(0, 100) })); setModerationError(""); }} placeholder="あの頃の記憶を、ありのままに。" rows={5} className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 text-[var(--text)] text-sm placeholder-[var(--placeholder)] focus:outline-none focus:border-[var(--accent)] resize-none leading-relaxed" />
            {moderationError && (
              <p className="text-[var(--danger)] text-xs leading-relaxed bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded-xl p-3">{moderationError}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted)] text-xs">{data.memoryText.length} / 100</span>
              <button onClick={handleNextFromStep1} disabled={!data.memoryText.trim() || moderating} className="bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-30">{moderating ? "確認中…" : "次へ"}</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[var(--text)] text-base font-medium mb-1">それはいつの記憶ですか？</h2>
              <p className="text-[var(--muted)] text-xs">年と、そのときの自分</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[var(--accent-2)] text-xs block mb-1.5">年</label>
                <input type="number" value={data.memoryYear} onChange={(e) => setData((d) => ({ ...d, memoryYear: e.target.value }))} placeholder="例：2008" min={1950} max={2025} className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-sm placeholder-[var(--placeholder)] focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="text-[var(--accent-2)] text-xs block mb-1.5">そのときの自分</label>
                <input type="text" value={data.lifeStage} onChange={(e) => setData((d) => ({ ...d, lifeStage: e.target.value }))} placeholder="例：高校3年生の夏" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-sm placeholder-[var(--placeholder)] focus:outline-none focus:border-[var(--accent)]" />
              </div>
            </div>
            <div>
              <p className="text-[var(--muted)] text-[10px] mb-2">よく使われる</p>
              <div className="flex flex-wrap gap-2">
                {["小学生の夏", "中学の部活", "高校3年生の受験", "大学の卒業式", "就職1年目", "第一子誕生"].map((p) => (
                  <button key={p} onClick={() => setData((d) => ({ ...d, lifeStage: p }))} className="text-[10px] text-[var(--accent-2)] border border-[var(--border)] rounded-full px-3 py-1 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">{p}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="text-[var(--muted)] text-sm px-4 py-2">戻る</button>
              <button onClick={() => setStep(3)} disabled={!data.memoryYear || !data.lifeStage} className="bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-30">次へ</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[var(--text)] text-base font-medium mb-1">あの頃の曲を選んでください</h2>
              <p className="text-[var(--muted)] text-xs">曲名またはアーティスト名で検索（なくても進めます）</p>
            </div>
            <div className="relative">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="曲名 / アーティスト" className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-4 pr-12 py-3 text-[var(--text)] text-sm placeholder-[var(--placeholder)] focus:outline-none focus:border-[var(--accent)]" />
              <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--accent)]">
                {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>
            {data.track && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--accent)]/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.track.artworkUrl100} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text)] text-sm font-medium truncate">{data.track.trackName}</p>
                  <p className="text-[var(--muted)] text-xs truncate">{data.track.artistName}</p>
                </div>
                <button onClick={() => setData((d) => ({ ...d, track: null, youtubeUrl: "", youtubeStart: "" }))} className="text-[var(--muted)] hover:text-[var(--danger)] shrink-0" aria-label="曲を外す">
                  <X size={16} />
                </button>
              </div>
            )}
            {searchResults.length > 0 && !data.track && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {searchResults.map((track) => (
                  <button key={track.trackId} onClick={() => { setData((d) => ({ ...d, track })); setSearchResults([]); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-colors text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={track.artworkUrl100} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[var(--text)] text-xs font-medium truncate">{track.trackName}</p>
                      <p className="text-[var(--muted)] text-[10px] truncate">{track.artistName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {data.track && (
              <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] overflow-hidden">
                <button onClick={() => setYtOpen((o) => !o)} className="w-full flex items-center gap-2 px-4 py-3">
                  <ExternalLink size={14} className="text-[var(--accent)] shrink-0" />
                  <span className="text-[var(--text)] text-xs flex-1 text-left">フル尺で流す（任意・YouTube）</span>
                  {ytOpen ? <ChevronUp size={14} className="text-[var(--muted)]" /> : <ChevronDown size={14} className="text-[var(--muted)]" />}
                </button>
                {ytOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-[var(--muted)] text-[10px] leading-relaxed">
                      下のボタンでYouTubeを開き、動画の「共有 → コピー」でリンクを取得してここに貼ってください。貼らなくても30秒の試聴が流れます。
                    </p>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${data.track.artistName} ${data.track.trackName}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-xs hover:border-[var(--accent)] transition-colors"
                    >
                      <ExternalLink size={16} className="text-[var(--accent)]" />
                      「{data.track.trackName}」をYouTubeで探す
                    </a>
                    <input type="text" value={data.youtubeUrl} onChange={(e) => setData((d) => ({ ...d, youtubeUrl: e.target.value }))} placeholder="ここにYouTubeのリンクを貼る" className="w-full bg-[var(--bg-elev)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-xs placeholder-[var(--placeholder)] focus:outline-none focus:border-[var(--accent)]" />
                    {videoId && (
                      <>
                        <p className="text-[var(--accent)] text-[10px]">✓ 動画が設定されました</p>
                        <input type="text" value={data.youtubeStart} onChange={(e) => setData((d) => ({ ...d, youtubeStart: e.target.value }))} placeholder="再生開始位置：例 1:30" className="w-full bg-[var(--bg-elev)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text)] text-xs placeholder-[var(--placeholder)] focus:outline-none focus:border-[var(--accent)]" />
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setStep(2)} className="text-[var(--muted)] text-sm px-4 py-2">戻る</button>
              {data.track ? (
                <button onClick={() => setStep(4)} className="bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold px-6 py-2.5 rounded-full">次へ</button>
              ) : (
                <button onClick={() => setStep(4)} className="text-[var(--accent-2)] border border-[var(--border)] text-sm px-6 py-2.5 rounded-full hover:border-[var(--accent)] transition-colors">曲なしで進む</button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[var(--text)] text-base font-medium mb-1">記憶をAIが描きます</h2>
              <p className="text-[var(--muted)] text-xs">4枚のシーンを生成します（約30〜60秒）</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-2">
              <div className="flex items-center gap-2">
                <Music size={12} className="text-[var(--accent)]" />
                <span className="text-[var(--accent)] text-xs">{data.track ? `${data.track.trackName} / ${data.track.artistName}` : "楽曲なし"}</span>
              </div>
              <p className="text-[var(--accent-2)] text-xs leading-relaxed">{data.memoryText}</p>
              <p className="text-[var(--muted)] text-[10px]">{data.memoryYear}年・{data.lifeStage}</p>
            </div>
            {generating ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, i) => {
                    // 進捗に応じて左上→右下の順に「描き終わった」風の演出をする
                    const done = genProgress >= (i + 1) * 22;
                    return (
                      <div key={i} className={`aspect-[3/4] rounded-xl border flex items-center justify-center transition-colors ${done ? "bg-[var(--surface-2)] border-[var(--accent)]/40" : "bg-[var(--surface)] border-[var(--border)]"}`}>
                        {done ? <CheckCircle size={20} className="text-[var(--accent)]" /> : <Loader2 size={20} className="text-[var(--accent)] animate-spin" />}
                      </div>
                    );
                  })}
                </div>
                <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className="h-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${genProgress}%` }} />
                </div>
                <p className="text-center text-[var(--muted)] text-xs">{genPhase}</p>
                <p className="text-center text-[var(--placeholder)] text-[10px]">生成中はこの画面を閉じないでください</p>
              </div>
            ) : (
              <button onClick={handleGenerateImages} className="w-full bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold py-3.5 rounded-full">画像を生成する</button>
            )}
            {!generating && <button onClick={() => setStep(3)} className="w-full text-[var(--muted)] text-sm py-2">戻る</button>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[var(--text)] text-base font-medium mb-1">プレビュー</h2>
              <p className="text-[var(--muted)] text-xs">タイムカプセルを確認してください</p>
            </div>
            {data.images.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {data.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" className="aspect-[3/4] w-full object-cover rounded-xl" />
                ))}
              </div>
            )}
            <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2">
                <Music size={12} className="text-[var(--accent)]" />
                <span className="text-[var(--accent)] text-xs">{data.track ? `${data.track.trackName} / ${data.track.artistName}` : "楽曲なし"}</span>
              </div>
              <p className="text-[var(--text)] text-sm leading-relaxed">{data.memoryText}</p>
              <p className="text-[var(--muted)] text-xs">{data.memoryYear}年・{data.lifeStage}</p>
            </div>
            <button onClick={handlePublish} disabled={publishing} className="w-full bg-[var(--accent)] text-[var(--bg)] text-sm font-semibold py-3.5 rounded-full disabled:opacity-50">
              {publishing ? "投稿中…" : "タイムカプセルを残す"}
            </button>
            <button onClick={() => setStep(4)} className="w-full text-[var(--muted)] text-sm py-2">戻る</button>
          </div>
        )}
      </div>
    </div>
  );
}
