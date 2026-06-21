"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Clock, Users, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import { mockTemplates } from "@/lib/play-mock-data";

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const template = mockTemplates.find((t) => t.id === id);
  const [modalOpen, setModalOpen] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([]);

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <span className="text-4xl">😕</span>
        <p className="text-[#8a7a70] text-sm">テンプレが見つかりませんでした</p>
        <Link href="/play" className="text-[#ff5f3d] text-sm font-bold underline">
          ホームに戻る
        </Link>
      </div>
    );
  }

  const toggleCheck = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const allChecked =
    checked.length === template.stuff.length && checked.every(Boolean);

  return (
    <div className="pb-32 bg-[#fffbf7] min-h-screen">
      {/* Hero */}
      <div
        className={`relative bg-gradient-to-br ${template.gradient} pt-14 pb-8 px-5`}
      >
        {/* Back / share */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <button className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 size={16} className="text-white" />
          </button>
        </div>

        <div className="text-center mt-4">
          <span className="text-8xl drop-shadow">{template.emoji}</span>
          <h1 className="text-white text-xl font-black mt-3 leading-tight">
            {template.title}
          </h1>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            {template.tagline}
          </p>
        </div>

        {/* Meta chips */}
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Clock size={13} className="text-white" />
            <span className="text-white text-xs font-medium">{template.durationLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Users size={13} className="text-white" />
            <span className="text-white text-xs font-medium">{template.peopleLabel}</span>
          </div>
          {template.tags.map((tag) => (
            <div
              key={tag}
              className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5"
            >
              <span className="text-white text-xs font-medium">{tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-5 space-y-6">
        {/* Description */}
        <p className="text-[#4a3a30] text-sm leading-relaxed">{template.description}</p>

        {/* Stuff needed */}
        <section>
          <h2 className="text-[#1c1410] text-base font-bold mb-3">
            必要なもの
          </h2>
          <div className="space-y-2">
            {template.stuff.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-[#ede4d8]"
              >
                <span className="text-[#ff5f3d] text-sm">✓</span>
                <span className="text-[#1c1410] text-sm">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section>
          <h2 className="text-[#1c1410] text-base font-bold mb-3">
            やること
          </h2>
          <div className="space-y-2">
            {template.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-[#ede4d8]"
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold bg-gradient-to-br ${template.gradient} text-white`}
                >
                  {i + 1}
                </div>
                <p className="text-[#1c1410] text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reports */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#1c1410] text-base font-bold">
              みんなの記録
            </h2>
            <span className="text-[#8a7a70] text-xs">
              {template.doCount.toLocaleString()}人がやった
            </span>
          </div>
          <div className="space-y-3">
            {template.reports.map((r, i) => (
              <div
                key={i}
                className="flex gap-3 bg-white rounded-xl p-3 border border-[#ede4d8]"
              >
                {r.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[#8a7a70] text-[11px] font-medium">{r.nickname}</p>
                  <p className="text-[#1c1410] text-sm mt-0.5 leading-relaxed">
                    {r.comment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA — sticky bottom */}
      <div className="fixed bottom-16 left-0 right-0 max-w-sm mx-auto px-4 pb-3 bg-[#fffbf7]/95 backdrop-blur pt-3 border-t border-[#ede4d8]">
        <button
          onClick={() => {
            setChecked(new Array(template.stuff.length).fill(false));
            setModalOpen(true);
          }}
          className={`w-full py-4 rounded-2xl text-white font-black text-base shadow-md bg-gradient-to-r ${template.gradient} active:scale-[0.98] transition-transform`}
        >
          ✨ やってみる！
        </button>
      </div>

      {/* "やってみる" modal / bottom sheet */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setModalOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto z-50 bg-white rounded-t-3xl overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#ede4d8]" />
            </div>

            <div className="px-5 pb-8 pt-2 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center">
                <span className="text-5xl">{template.emoji}</span>
                <h3 className="text-[#1c1410] font-black text-lg mt-2 leading-tight">
                  {template.title}
                </h3>
                <p className="text-[#8a7a70] text-xs mt-1">{template.durationLabel}</p>
              </div>

              {/* Checklist */}
              <div>
                <p className="text-[#8a7a70] text-xs font-bold uppercase tracking-widest mb-2">
                  持ち物チェック
                </p>
                <div className="space-y-2">
                  {template.stuff.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => toggleCheck(i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                        checked[i]
                          ? "bg-[#fff0ed] border-[#ff5f3d]"
                          : "bg-[#fafaf7] border-[#ede4d8]"
                      }`}
                    >
                      {checked[i] ? (
                        <CheckCircle2 size={18} className="text-[#ff5f3d] shrink-0" />
                      ) : (
                        <Circle size={18} className="text-[#ede4d8] shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          checked[i]
                            ? "text-[#ff5f3d] line-through"
                            : "text-[#1c1410]"
                        }`}
                      >
                        {item}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Link
                  href={`/play/record?templateId=${template.id}`}
                  className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-white text-base shadow bg-gradient-to-r ${template.gradient}`}
                >
                  やった！記録する
                  <ChevronRight size={18} />
                </Link>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-3 rounded-2xl text-[#8a7a70] text-sm font-medium bg-[#f5ede3]"
                >
                  あとで
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
