"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Music, CheckCircle, Loader2 } from "lucide-react";
import { searchMusic, extractYoutubeId, type ItunesTrack } from "@/lib/itunes";

type Step = 1 | 2 | 3 | 4 | 5;

interface PostData {
  memoryText: string;
  memoryYear: string;
  lifeStage: string;
  track: ItunesTrack | null;
  youtubeUrl: string;
  images: string[];
}

const STEP_LABELS = ["記憶", "年代", "楽曲", "画像生成", "完成"];

export default function PostPage() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<PostData>({
    memoryText: "",
    memoryYear: "",
    lifeStage: "",
    track: null,
    youtubeUrl: "",
    images: [],
  });

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ItunesTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    const results = await searchMusic(query);
    setSearchResults(results);
    setSearching(false);
  };

  const handleGenerateImages = async () => {
    setGenerating(true);
    // Mock: wait 2s then show placeholder images
    await new Promise((r) => setTimeout(r, 2000));
    setData((d) => ({
      ...d,
      images: [
        `https://picsum.photos/seed/gen1${Date.now()}/400/600`,
        `https://picsum.photos/seed/gen2${Date.now()}/400/600`,
        `https://picsum.photos/seed/gen3${Date.now()}/400/600`,
        `https://picsum.photos/seed/gen4${Date.now()}/400/600`,
      ],
    }));
    setGenerating(false);
    setStep(5);
  };

  const videoId = extractYoutubeId(data.youtubeUrl);

  return (
    <div className="pb-24 min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#13110e]/90 backdrop-blur border-b border-[#3a2e20]">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <Link href="/" className="text-[#a89880]">
            <ArrowLeft size={20} />
          </Link>
          <span className="text-[#f0e8d0] text-sm font-medium">
            タイムカプセルを作る
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex px-4 pb-3 gap-1.5">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step;
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`h-1 w-full rounded-full transition-colors ${
                    done || active ? "bg-[#d4a85c]" : "bg-[#3a2e20]"
                  }`}
                />
                <span
                  className={`text-[9px] tracking-wide ${
                    active
                      ? "text-[#d4a85c]"
                      : done
                      ? "text-[#a89880]"
                      : "text-[#3a2e20]"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-6">
        {/* Step 1: Memory text */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#f0e8d0] text-base font-medium mb-1">
                あの日の記憶を書いてください
              </h2>
              <p className="text-[#6b5c48] text-xs">100文字以内</p>
            </div>
            <textarea
              value={data.memoryText}
              onChange={(e) =>
                setData((d) => ({ ...d, memoryText: e.target.value.slice(0, 100) }))
              }
              placeholder="あの頃の記憶を、ありのままに。"
              rows={5}
              className="w-full bg-[#1f1a14] border border-[#3a2e20] rounded-xl p-4 text-[#f0e8d0] text-sm placeholder-[#4a3e30] focus:outline-none focus:border-[#d4a85c] resize-none leading-relaxed"
            />
            <div className="flex justify-between items-center">
              <span className="text-[#6b5c48] text-xs">
                {data.memoryText.length} / 100
              </span>
              <button
                onClick={() => setStep(2)}
                disabled={data.memoryText.trim().length === 0}
                className="bg-[#d4a85c] text-[#13110e] text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-30 transition-opacity"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Year + life stage */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#f0e8d0] text-base font-medium mb-1">
                それはいつの記憶ですか？
              </h2>
              <p className="text-[#6b5c48] text-xs">年と、そのときの自分</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[#a89880] text-xs block mb-1.5">
                  年
                </label>
                <input
                  type="number"
                  value={data.memoryYear}
                  onChange={(e) =>
                    setData((d) => ({ ...d, memoryYear: e.target.value }))
                  }
                  placeholder="例：2008"
                  min={1950}
                  max={2025}
                  className="w-full bg-[#1f1a14] border border-[#3a2e20] rounded-xl px-4 py-3 text-[#f0e8d0] text-sm placeholder-[#4a3e30] focus:outline-none focus:border-[#d4a85c]"
                />
              </div>
              <div>
                <label className="text-[#a89880] text-xs block mb-1.5">
                  そのときの自分
                </label>
                <input
                  type="text"
                  value={data.lifeStage}
                  onChange={(e) =>
                    setData((d) => ({ ...d, lifeStage: e.target.value }))
                  }
                  placeholder="例：高校3年生の夏"
                  className="w-full bg-[#1f1a14] border border-[#3a2e20] rounded-xl px-4 py-3 text-[#f0e8d0] text-sm placeholder-[#4a3e30] focus:outline-none focus:border-[#d4a85c]"
                />
              </div>
            </div>

            {/* Popular presets */}
            <div>
              <p className="text-[#6b5c48] text-[10px] mb-2">よく使われる</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "小学生の夏",
                  "中学の部活",
                  "高校3年生の受験",
                  "大学の卒業式",
                  "就職1年目",
                  "第一子誕生",
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() =>
                      setData((d) => ({ ...d, lifeStage: preset }))
                    }
                    className="text-[10px] text-[#a89880] border border-[#3a2e20] rounded-full px-3 py-1 hover:border-[#d4a85c] hover:text-[#d4a85c] transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-[#6b5c48] text-sm px-4 py-2"
              >
                戻る
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!data.memoryYear || !data.lifeStage}
                className="bg-[#d4a85c] text-[#13110e] text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-30 transition-opacity"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Music search */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#f0e8d0] text-base font-medium mb-1">
                あの頃の曲を選んでください
              </h2>
              <p className="text-[#6b5c48] text-xs">
                曲名またはアーティスト名で検索
              </p>
            </div>

            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="曲名 / アーティスト"
                className="w-full bg-[#1f1a14] border border-[#3a2e20] rounded-xl pl-4 pr-12 py-3 text-[#f0e8d0] text-sm placeholder-[#4a3e30] focus:outline-none focus:border-[#d4a85c]"
              />
              <button
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d4a85c]"
              >
                {searching ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
              </button>
            </div>

            {/* Selected track */}
            {data.track && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1f1a14] border border-[#d4a85c]/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.track.artworkUrl100}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[#f0e8d0] text-sm font-medium truncate">
                    {data.track.trackName}
                  </p>
                  <p className="text-[#6b5c48] text-xs truncate">
                    {data.track.artistName}
                  </p>
                </div>
                <CheckCircle size={16} className="text-[#d4a85c] shrink-0" />
              </div>
            )}

            {/* Search results */}
            {searchResults.length > 0 && !data.track && (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {searchResults.map((track) => (
                  <button
                    key={track.trackId}
                    onClick={() => {
                      setData((d) => ({ ...d, track }));
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[#1f1a14] border border-[#3a2e20] hover:border-[#d4a85c]/40 transition-colors text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={track.artworkUrl100}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f0e8d0] text-xs font-medium truncate">
                        {track.trackName}
                      </p>
                      <p className="text-[#6b5c48] text-[10px] truncate">
                        {track.artistName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* YouTube URL input */}
            {data.track && (
              <div className="space-y-2">
                <label className="text-[#a89880] text-xs block">
                  YouTube URL を貼る（任意）
                </label>
                <input
                  type="text"
                  value={data.youtubeUrl}
                  onChange={(e) =>
                    setData((d) => ({ ...d, youtubeUrl: e.target.value }))
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-[#1f1a14] border border-[#3a2e20] rounded-xl px-4 py-3 text-[#f0e8d0] text-xs placeholder-[#4a3e30] focus:outline-none focus:border-[#d4a85c]"
                />
                {data.youtubeUrl && !videoId && (
                  <p className="text-red-400/70 text-[10px]">
                    有効なYouTube URLを入力してください
                  </p>
                )}
                {videoId && (
                  <p className="text-[#d4a85c] text-[10px]">✓ 動画が設定されました</p>
                )}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="text-[#6b5c48] text-sm px-4 py-2"
              >
                戻る
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!data.track}
                className="bg-[#d4a85c] text-[#13110e] text-sm font-semibold px-6 py-2.5 rounded-full disabled:opacity-30 transition-opacity"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Image generation */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#f0e8d0] text-base font-medium mb-1">
                記憶をAIが描きます
              </h2>
              <p className="text-[#6b5c48] text-xs">
                4枚のシーンを生成します（約30秒）
              </p>
            </div>

            {/* Memory preview */}
            <div className="p-4 rounded-xl bg-[#1f1a14] border border-[#3a2e20] space-y-2">
              <div className="flex items-center gap-2">
                <Music size={12} className="text-[#d4a85c]" />
                <span className="text-[#d4a85c] text-xs">
                  {data.track?.trackName} / {data.track?.artistName}
                </span>
              </div>
              <p className="text-[#a89880] text-xs leading-relaxed">
                {data.memoryText}
              </p>
              <p className="text-[#6b5c48] text-[10px]">
                {data.memoryYear}年・{data.lifeStage}
              </p>
            </div>

            {generating ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-xl bg-[#1f1a14] border border-[#3a2e20] flex items-center justify-center"
                  >
                    <Loader2
                      size={20}
                      className="text-[#d4a85c] animate-spin"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={handleGenerateImages}
                className="w-full bg-[#d4a85c] text-[#13110e] text-sm font-semibold py-3.5 rounded-full"
              >
                画像を生成する
              </button>
            )}

            {!generating && (
              <button
                onClick={() => setStep(3)}
                className="w-full text-[#6b5c48] text-sm py-2"
              >
                戻る
              </button>
            )}
          </div>
        )}

        {/* Step 5: Preview & publish */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[#f0e8d0] text-base font-medium mb-1">
                プレビュー
              </h2>
              <p className="text-[#6b5c48] text-xs">
                タイムカプセルを確認してください
              </p>
            </div>

            {/* Images grid */}
            {data.images.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {data.images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="aspect-[3/4] w-full object-cover rounded-xl sepia-[.4] brightness-75"
                  />
                ))}
              </div>
            )}

            {/* Song + memory */}
            <div className="p-4 rounded-xl bg-[#1f1a14] border border-[#3a2e20] space-y-3">
              <div className="flex items-center gap-2">
                <Music size={12} className="text-[#d4a85c]" />
                <span className="text-[#d4a85c] text-xs">
                  {data.track?.trackName} / {data.track?.artistName}
                </span>
              </div>
              <p className="text-[#f0e8d0] text-sm leading-relaxed">
                {data.memoryText}
              </p>
              <p className="text-[#6b5c48] text-xs">
                {data.memoryYear}年・{data.lifeStage}
              </p>
            </div>

            <Link
              href="/"
              className="block w-full bg-[#d4a85c] text-[#13110e] text-sm font-semibold py-3.5 rounded-full text-center"
            >
              タイムカプセルを残す
            </Link>

            <button
              onClick={() => setStep(4)}
              className="w-full text-[#6b5c48] text-sm py-2"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
