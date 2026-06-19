"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Music, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { searchMusic, extractYoutubeId, type ItunesTrack } from "@/lib/itunes";

type Step = 1 | 2 | 3 | 4 | 5;
const STEP_LABELS = ["記憶", "年代", "楽曲", "画像生成", "完成"];

interface PostData {
  memoryText: string;
  memoryYear: string;
  lifeStage: string;
  track: ItunesTrack | null;
  youtubeUrl: string;
  youtubeStart: string;
  images: string[];
}

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
  const [data, setData] = useState<PostData>({ memoryText: "", memoryYear: "", lifeStage: "", track: null, youtubeUrl: "", youtubeStart: "", images: [] });
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItunesTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [moderating, setModerating] = useState(false);
  const [moderationError, setModerationError] = useState("");

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
            ? `この内容は投稿できません：${json.reason}`
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
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoryText: data.memoryText, memoryYear: data.memoryYear, lifeStage: data.lifeStage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "画像生成に失敗しました");
      setData((d) => ({ ...d, images: json.images }));
      setStep(5);
    } catch (e) {
      alert(e instanceof Error ? e.message : "画像生成に失敗しました。もう一度お試しください。");
    } finally {
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
        userNickname: user.displayName,
        userBirthYear: null,
        userGender: null,
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
      <div className="sticky top-0 z-40 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <Link href="/" className="text-[#b899a8]"><ArrowLeft size={20} /></Link>
          <span className="text-[#ede0e8] text-sm font-medium">タイムカプセルを作る</span>
        </div>
        <div className="flex px-4 pb-3 gap-1.5">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = step > n; const active = step === n;
            return (
              <div key={n} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full transition-colors ${done || active ? "bg-[#c48a9f]" : "bg-[#2d1e30]"}`} />
                <span className={`text-[9px] tracking-wide ${active ? "text-[#c48a9f]" : done ? "text-[#b899a8]" : "text-[#2d1e30]"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#ede0e8] text-base font-medium mb-1">あの日の記憶を書いてください</h2>
              <p className="text-[#7a6475] text-xs">100文字以内</p>
            </div>
            <textarea value={data.memoryText} onChange={(e) => { setData((d) => ({ ...d, memoryText: e.target.value.slice(0, 100) })); setModerationError(""); }} placeholder="あの頃の記憶を、ありのままに。" rows={5} className="w-full bg-[#1a1520] border border-[#2d1e30] rounded-xl p-4 text-[#ede0e8] text-sm placeholder-[#3d2d3a] focus:outline-none focus:border-[#c48a9f] resize-none leading-relaxed" />
            {moderationError && (
              <p className="text-[#c4727f] text-xs leading-relaxed bg-[#c4727f]/10 border border-[#c4727f]/30 rounded-xl p-3">{moderationError}</p>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#7a6475] text-xs">{data.memoryText.length} / 100</span>
              <button onClick={handleNextFromStep1} disabled={!data.memoryText.trim() || moderating} className="bg-[#c48a9f] text-[#0e0b0e] text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-30">{moderating ? "確認中…" : "次へ"}</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#ede0e8] text-base font-medium mb-1">それはいつの記憶ですか？</h2>
              <p className="text-[#7a6475] text-xs">年と、そのときの自分</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[#b899a8] text-xs block mb-1.5">年</label>
                <input type="number" value={data.memoryYear} onChange={(e) => setData((d) => ({ ...d, memoryYear: e.target.value }))} placeholder="例：2008" min={1950} max={2025} className="w-full bg-[#1a1520] border border-[#2d1e30] rounded-xl px-4 py-3 text-[#ede0e8] text-sm placeholder-[#3d2d3a] focus:outline-none focus:border-[#c48a9f]" />
              </div>
              <div>
                <label className="text-[#b899a8] text-xs block mb-1.5">そのときの自分</label>
                <input type="text" value={data.lifeStage} onChange={(e) => setData((d) => ({ ...d, lifeStage: e.target.value }))} placeholder="例：高校3年生の夏" className="w-full bg-[#1a1520] border border-[#2d1e30] rounded-xl px-4 py-3 text-[#ede0e8] text-sm placeholder-[#3d2d3a] focus:outline-none focus:border-[#c48a9f]" />
              </div>
            </div>
            <div>
              <p className="text-[#7a6475] text-[10px] mb-2">よく使われる</p>
              <div className="flex flex-wrap gap-2">
                {["小学生の夏", "中学の部活", "高校3年生の受験", "大学の卒業式", "就職1年目", "第一子誕生"].map((p) => (
                  <button key={p} onClick={() => setData((d) => ({ ...d, lifeStage: p }))} className="text-[10px] text-[#b899a8] border border-[#2d1e30] rounded-full px-3 py-1 hover:border-[#c48a9f] hover:text-[#c48a9f] transition-colors">{p}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(1)} className="text-[#7a6475] text-sm px-4 py-2">戻る</button>
              <button onClick={() => setStep(3)} disabled={!data.memoryYear || !data.lifeStage} className="bg-[#c48a9f] text-[#0e0b0e] text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-30">次へ</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#ede0e8] text-base font-medium mb-1">あの頃の曲を選んでください</h2>
              <p className="text-[#7a6475] text-xs">曲名またはアーティスト名で検索</p>
            </div>
            <div className="relative">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="曲名 / アーティスト" className="w-full bg-[#1a1520] border border-[#2d1e30] rounded-xl pl-4 pr-12 py-3 text-[#ede0e8] text-sm placeholder-[#3d2d3a] focus:outline-none focus:border-[#c48a9f]" />
              <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c48a9f]">
                {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>
            {data.track && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1520] border border-[#c48a9f]/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.track.artworkUrl100} alt="" className="w-10 h-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-[#ede0e8] text-sm font-medium truncate">{data.track.trackName}</p>
                  <p className="text-[#7a6475] text-xs truncate">{data.track.artistName}</p>
                </div>
                <CheckCircle size={16} className="text-[#c48a9f] shrink-0" />
              </div>
            )}
            {searchResults.length > 0 && !data.track && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {searchResults.map((track) => (
                  <button key={track.trackId} onClick={() => { setData((d) => ({ ...d, track })); setSearchResults([]); }} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#1a1520] border border-[#2d1e30] hover:border-[#c48a9f]/40 transition-colors text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={track.artworkUrl100} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#ede0e8] text-xs font-medium truncate">{track.trackName}</p>
                      <p className="text-[#7a6475] text-[10px] truncate">{track.artistName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {data.track && (
              <div className="space-y-2">
                <label className="text-[#b899a8] text-xs block">フル尺で流したい場合（任意）</label>
                <p className="text-[#7a6475] text-[10px] leading-relaxed">
                  下のボタンでYouTubeを開き、曲の動画を見つけたら「共有 → リンクをコピー」して、ここに貼ってください。貼らなくても30秒の試聴は流れます。
                </p>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                    `${data.track.artistName} ${data.track.trackName}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#221928] border border-[#2d1e30] rounded-xl px-4 py-3 text-[#ede0e8] text-xs hover:border-[#c48a9f] transition-colors"
                >
                  <ExternalLink size={16} className="text-[#c48a9f]" />
                  「{data.track.trackName}」をYouTubeで探す
                </a>
                <input type="text" value={data.youtubeUrl} onChange={(e) => setData((d) => ({ ...d, youtubeUrl: e.target.value }))} placeholder="ここにYouTubeのリンクを貼る" className="w-full bg-[#1a1520] border border-[#2d1e30] rounded-xl px-4 py-3 text-[#ede0e8] text-xs placeholder-[#3d2d3a] focus:outline-none focus:border-[#c48a9f]" />
                {videoId && (
                  <>
                    <p className="text-[#c48a9f] text-[10px]">✓ 動画が設定されました</p>
                    <label className="text-[#b899a8] text-xs block pt-1">再生を始める位置（任意・サビなど）</label>
                    <input type="text" value={data.youtubeStart} onChange={(e) => setData((d) => ({ ...d, youtubeStart: e.target.value }))} placeholder="例：1:30（1分30秒から）" className="w-full bg-[#1a1520] border border-[#2d1e30] rounded-xl px-4 py-3 text-[#ede0e8] text-xs placeholder-[#3d2d3a] focus:outline-none focus:border-[#c48a9f]" />
                  </>
                )}
              </div>
            )}
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)} className="text-[#7a6475] text-sm px-4 py-2">戻る</button>
              <button onClick={() => setStep(4)} disabled={!data.track} className="bg-[#c48a9f] text-[#0e0b0e] text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-30">次へ</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#ede0e8] text-base font-medium mb-1">記憶をAIが描きます</h2>
              <p className="text-[#7a6475] text-xs">4枚のシーンを生成します（約30〜60秒）</p>
            </div>
            <div className="p-4 rounded-xl bg-[#1a1520] border border-[#2d1e30] space-y-2">
              <div className="flex items-center gap-2">
                <Music size={12} className="text-[#c48a9f]" />
                <span className="text-[#c48a9f] text-xs">{data.track?.trackName} / {data.track?.artistName}</span>
              </div>
              <p className="text-[#b899a8] text-xs leading-relaxed">{data.memoryText}</p>
              <p className="text-[#7a6475] text-[10px]">{data.memoryYear}年・{data.lifeStage}</p>
            </div>
            {generating ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-xl bg-[#1a1520] border border-[#2d1e30] flex items-center justify-center">
                      <Loader2 size={20} className="text-[#c48a9f] animate-spin" />
                    </div>
                  ))}
                </div>
                <p className="text-center text-[#7a6475] text-xs">AIが記憶を描いています…</p>
              </div>
            ) : (
              <button onClick={handleGenerateImages} className="w-full bg-[#c48a9f] text-[#0e0b0e] text-sm font-semibold py-3.5 rounded-full">画像を生成する</button>
            )}
            {!generating && <button onClick={() => setStep(3)} className="w-full text-[#7a6475] text-sm py-2">戻る</button>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#ede0e8] text-base font-medium mb-1">プレビュー</h2>
              <p className="text-[#7a6475] text-xs">タイムカプセルを確認してください</p>
            </div>
            {data.images.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {data.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" className="aspect-[3/4] w-full object-cover rounded-xl sepia-[.4] brightness-75" />
                ))}
              </div>
            )}
            <div className="p-4 rounded-xl bg-[#1a1520] border border-[#2d1e30] space-y-3">
              <div className="flex items-center gap-2">
                <Music size={12} className="text-[#c48a9f]" />
                <span className="text-[#c48a9f] text-xs">{data.track?.trackName} / {data.track?.artistName}</span>
              </div>
              <p className="text-[#ede0e8] text-sm leading-relaxed">{data.memoryText}</p>
              <p className="text-[#7a6475] text-xs">{data.memoryYear}年・{data.lifeStage}</p>
            </div>
            <button onClick={handlePublish} disabled={publishing} className="w-full bg-[#c48a9f] text-[#0e0b0e] text-sm font-semibold py-3.5 rounded-full disabled:opacity-50">
              {publishing ? "投稿中…" : "タイムカプセルを残す"}
            </button>
            <button onClick={() => setStep(4)} className="w-full text-[#7a6475] text-sm py-2">戻る</button>
          </div>
        )}
      </div>
    </div>
  );
}
