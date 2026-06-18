"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, Music, ChevronLeft, ChevronRight, Play, Pause, Share2, ImageDown } from "lucide-react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { CapsuleDoc } from "@/lib/types";

export default function CapsulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [capsule, setCapsule] = useState<CapsuleDoc | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showCounts, setShowCounts] = useState<Record<number, number>>({0: 0});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  };

  // activeImageが変わるたびにそのスライドのアニメーションを再スタートさせる
  useEffect(() => {
    setShowCounts((prev) => ({ ...prev, [activeImage]: (prev[activeImage] ?? 0) + 1 }));
  }, [activeImage]);

  // 7秒ごとに自動スライド
  const imageCount = (capsule?.images ?? []).filter(Boolean).length;
  useEffect(() => {
    if (imageCount <= 1) return;
    const timer = setInterval(() => {
      setActiveImage((i) => (i + 1) % imageCount);
    }, 7000);
    return () => clearInterval(timer);
  }, [imageCount]);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "capsules", id));
      if (snap.exists()) {
        setCapsule({ id: snap.id, ...snap.data() } as CapsuleDoc);
        await updateDoc(doc(db, "capsules", id), { views: increment(1) });
      }
    };
    load();
  }, [id]);

  // カプセルを開いたら試聴を自動再生（ブラウザがブロックした場合はボタンで再生）
  useEffect(() => {
    if (!capsule?.previewUrl) return;
    const audio = audioRef.current;
    if (audio) audio.play().catch(() => {});
  }, [capsule?.previewUrl]);

  const buildShareImageUrl = (c: CapsuleDoc) => {
    const params = new URLSearchParams({
      img: (c.images ?? []).filter(Boolean)[0] ?? "",
      text: c.memoryText ?? "",
      song: c.songTitle ?? "",
      artist: c.artistName ?? "",
      year: c.memoryYear ? String(c.memoryYear) : "",
    });
    return `/api/share-image?${params.toString()}`;
  };

  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!capsule) return;
    setSharing(true);
    try {
      const res = await fetch(buildShareImageUrl(capsule));
      const blob = await res.blob();
      const file = new File([blob], "capsule.png", { type: "image/png" });
      const shareText = `${capsule.memoryText}\n♪ ${capsule.songTitle ?? ""} / ${capsule.artistName ?? ""}\n#CAPSULE`;
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: shareText });
      } else if (navigator.share) {
        await navigator.share({ text: shareText, url: window.location.href });
      } else {
        // PC など共有非対応 → Xを開く
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
        window.open(url, "_blank");
      }
    } catch {
      // ユーザーがキャンセルした場合など。何もしない
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = async () => {
    if (!capsule) return;
    setSharing(true);
    try {
      const res = await fetch(buildShareImageUrl(capsule));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "capsule.png";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setSharing(false);
    }
  };

  if (!capsule) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-[#c48a9f] border-t-transparent animate-spin" />
      </div>
    );
  }

  const images = (capsule.images ?? []).filter(Boolean);
  const age = capsule.userBirthYear
    ? new Date().getFullYear() - capsule.userBirthYear
    : null;

  return (
    <div className="capsule-reveal pb-24">
      {/* 開封カーテン — 暗幕がフェードアウトして記憶が浮かび上がる */}
      <div className="capsule-curtain fixed inset-0 z-[55] bg-[#0e0b0e] pointer-events-none" aria-hidden="true" />

      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4 bg-[#0e0b0e]/90 backdrop-blur border-b border-[#2d1e30]">
        <Link href="/" className="text-[#b899a8] hover:text-[#ede0e8] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[#ede0e8] text-sm font-medium truncate">{capsule.songTitle ?? "—"}</p>
          <p className="text-[#7a6475] text-xs truncate">{capsule.artistName ?? ""}</p>
        </div>
        <button onClick={handleShare} disabled={sharing} className="shrink-0 text-[#b899a8] hover:text-[#c48a9f] transition-colors disabled:opacity-40" aria-label="シェア">
          <Share2 size={19} />
        </button>
      </div>

      <div className="px-4 pt-5 space-y-5">
        <div className="space-y-1">
          <p className="serif text-[#ede0e8] text-base leading-loose">{capsule.memoryText}</p>
          <p className="text-[#c48a9f] text-xs">{capsule.memoryYear}年・{capsule.lifeStage}</p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#7a6475]">
            {age ? `${age}歳` : ""}
            {age && capsule.userGender ? "・" : ""}
            {capsule.userGender ?? ""}
          </span>
          <div className="flex items-center gap-1 text-[#7a6475]">
            <Eye size={11} />
            <span>{(capsule.views ?? 0).toLocaleString()}回開かれた</span>
          </div>
        </div>

        <div className="border-t border-[#2d1e30]" />

        {images.length > 0 && (
          <div>
            <p className="text-[#7a6475] text-[10px] tracking-widest uppercase mb-3">
              AI が描いた記憶のシーン
            </p>
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-black">
              {images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i === activeImage ? `${i}-${showCounts[i] ?? 0}` : i}
                  src={img}
                  alt=""
                  className={`absolute inset-0 w-full h-full object-cover sepia-[.4] brightness-75 transition-opacity duration-[2000ms] ease-in-out ${
                    i === activeImage ? `opacity-100 kb-${i % 4}` : "opacity-0"
                  }`}
                />
              ))}
              <button onClick={() => setActiveImage((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1 z-10">
                <ChevronLeft size={16} className="text-white" />
              </button>
              <button onClick={() => setActiveImage((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-1 z-10">
                <ChevronRight size={16} className="text-white" />
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                {images.map((_, i) => (
                  <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === activeImage ? "w-4 bg-[#c48a9f]" : "w-1 bg-white/40"}`} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${activeImage === i ? "border-[#c48a9f]" : "border-transparent"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover sepia-[.4] brightness-75" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1520] border border-[#2d1e30]">
          {capsule.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={capsule.artworkUrl} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
          ) : (
            <Music size={16} className="text-[#c48a9f] shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[#ede0e8] text-sm font-medium truncate">{capsule.songTitle}</p>
            <p className="text-[#7a6475] text-xs truncate">{capsule.artistName}</p>
          </div>
          {capsule.previewUrl && (
            <button
              onClick={togglePlay}
              className="shrink-0 w-10 h-10 rounded-full bg-[#c48a9f] text-[#0e0b0e] flex items-center justify-center"
              aria-label={playing ? "一時停止" : "再生"}
            >
              {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
          )}
        </div>

        {capsule.previewUrl && (
          <>
            <audio
              ref={audioRef}
              src={capsule.previewUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            <p className="text-center text-[#7a6475] text-[10px]">♪ 30秒の試聴</p>
          </>
        )}

        {/* シェア */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleShare} disabled={sharing} className="flex items-center justify-center gap-2 bg-[#c48a9f] text-[#0e0b0e] text-sm font-semibold py-3 rounded-full disabled:opacity-50">
            <Share2 size={16} />
            {sharing ? "準備中…" : "シェア"}
          </button>
          <button onClick={handleDownload} disabled={sharing} className="flex items-center justify-center gap-2 bg-[#221928] border border-[#2d1e30] text-[#ede0e8] text-sm py-3 rounded-full disabled:opacity-50">
            <ImageDown size={16} className="text-[#c48a9f]" />
            画像を保存
          </button>
        </div>
        <p className="text-center text-[#7a6475] text-[10px] -mt-3">
          画像を保存してインスタのストーリーに、「シェア」からXやLINEへ
        </p>

        {/* フル尺YouTube（任意・下部に小さく） */}
        {capsule.youtubeVideoId && (
          <div className="pt-2">
            <p className="text-[#7a6475] text-[10px] tracking-widest uppercase mb-2">フル尺で聴く</p>
            <div className="youtube-wrapper bg-black rounded-xl overflow-hidden border border-[#2d1e30]">
              <iframe
                src={`https://www.youtube.com/embed/${capsule.youtubeVideoId}?rel=0&modestbranding=1${capsule.youtubeStart ? `&start=${capsule.youtubeStart}` : ""}`}
                title={capsule.songTitle ?? ""}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
