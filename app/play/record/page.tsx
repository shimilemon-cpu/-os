"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Camera, X, Share2, CheckCircle } from "lucide-react";
import { mockTemplates } from "@/lib/play-mock-data";

function RecordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const templateId = params.get("templateId");
  const template = templateId ? mockTemplates.find((t) => t.id === templateId) : null;

  const [photos, setPhotos] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const urls = files.slice(0, 3 - photos.length).map((f) => URL.createObjectURL(f));
    setPhotos((prev) => [...prev, ...urls].slice(0, 3));
    e.target.value = "";
  };

  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    if (!comment.trim()) return;
    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-6 bg-[#fffbf7]">
        <div className="w-20 h-20 rounded-full bg-[#fff0ed] flex items-center justify-center">
          <CheckCircle size={40} className="text-[#ff5f3d]" />
        </div>
        <div>
          <h2 className="text-[#1c1410] text-2xl font-black">記録しました！</h2>
          <p className="text-[#8a7a70] text-sm mt-2">
            {template ? `「${template.title}」をやりました` : "あそびかたを記録しました"}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-[#ff5f3d] text-white font-bold px-6 py-3 rounded-2xl shadow-md">
          <Share2 size={18} />
          友達におすそ分け
        </button>
        <button
          onClick={() => router.push("/play")}
          className="text-[#8a7a70] text-sm underline"
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-[#fffbf7] min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#fffbf7]/95 backdrop-blur border-b border-[#ede4d8] flex items-center gap-3 px-4 pt-12 pb-3">
        <button
          onClick={() => router.back()}
          className="text-[#8a7a70] w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#ede4d8] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-[#1c1410] font-black text-lg">今日の記録</h1>
      </header>

      <div className="px-4 pt-5 space-y-6">
        {/* Template tag */}
        {template && (
          <div className={`flex items-center gap-3 bg-gradient-to-r ${template.gradient} rounded-2xl px-4 py-3`}>
            <span className="text-3xl">{template.emoji}</span>
            <div>
              <p className="text-white/70 text-[11px]">やったこと</p>
              <p className="text-white font-bold text-sm leading-tight">{template.title}</p>
            </div>
          </div>
        )}

        {/* Photo upload */}
        <section>
          <h2 className="text-[#1c1410] font-bold text-sm mb-1">
            写真を追加 <span className="text-[#8a7a70] font-normal">（最大3枚）</span>
          </h2>
          <p className="text-[#8a7a70] text-xs mb-3">
            やっている様子や、完成したものを残そう
          </p>
          <div className="flex gap-3">
            {photos.map((url, i) => (
              <div
                key={i}
                className="relative w-[calc(33%-4px)] aspect-square rounded-xl overflow-hidden bg-[#ede4d8]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X size={11} className="text-white" />
                </button>
              </div>
            ))}
            {photos.length < 3 && (
              <button
                onClick={() => inputRef.current?.click()}
                className="w-[calc(33%-4px)] aspect-square rounded-xl border-2 border-dashed border-[#ede4d8] flex flex-col items-center justify-center gap-1 bg-white"
              >
                <Camera size={22} className="text-[#8a7a70]" />
                <span className="text-[10px] text-[#8a7a70]">追加</span>
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoSelect}
          />
        </section>

        {/* Comment */}
        <section>
          <h2 className="text-[#1c1410] font-bold text-sm mb-1">
            一言コメント <span className="text-[#ff5f3d]">*</span>
          </h2>
          <p className="text-[#8a7a70] text-xs mb-3">
            やってみてどうだった？次の人へのひと言で OK
          </p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例：近所に知らない神社があった。住んで5年なのに"
            maxLength={100}
            rows={3}
            className="w-full bg-white border border-[#ede4d8] rounded-2xl px-4 py-3 text-[#1c1410] text-sm placeholder:text-[#c4b8b0] resize-none focus:outline-none focus:border-[#ff5f3d] transition-colors"
          />
          <div className="text-right mt-1 text-[#c4b8b0] text-[11px]">
            {comment.length}/100
          </div>
        </section>

        {/* Share options */}
        <section>
          <h2 className="text-[#1c1410] font-bold text-sm mb-3">シェアする</h2>
          <div className="grid grid-cols-2 gap-2">
            {["X (Twitter)", "LINE", "Instagram", "リンクをコピー"].map((label) => (
              <button
                key={label}
                className="flex items-center justify-center gap-2 bg-white border border-[#ede4d8] rounded-xl px-3 py-2.5 text-[#4a3a30] text-xs font-medium"
              >
                <Share2 size={13} className="text-[#8a7a70]" />
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Submit */}
      <div className="fixed bottom-16 left-0 right-0 max-w-sm mx-auto px-4 pb-3 bg-[#fffbf7]/95 backdrop-blur pt-3 border-t border-[#ede4d8]">
        <button
          onClick={handleSubmit}
          disabled={!comment.trim()}
          className="w-full py-4 rounded-2xl font-black text-base shadow-md bg-gradient-to-r from-[#ff5f3d] to-orange-400 text-white disabled:opacity-40 disabled:shadow-none active:scale-[0.98] transition-all"
        >
          投稿する ✨
        </button>
      </div>
    </div>
  );
}

export default function RecordPage() {
  return (
    <Suspense>
      <RecordForm />
    </Suspense>
  );
}
