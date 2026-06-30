"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import {
  subscribeEngawaPost, subscribeEngawaAnswers, addEngawaAnswer,
} from "@/lib/ogiri/engawa";
import type { EngawaPostDoc, EngawaAnswerDoc } from "@/lib/types";
import Icon from "@/components/Icon";

const GENRE_COLORS: Record<string, string> = {
  日常: "#2BA35F", 恋愛: "#E5402F", 仕事: "#5BA9D6", カオス: "#F4C422", その他: "#B6AC97",
};

export default function EngawaDetailPage() {
  const { id: postId } = useParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<EngawaPostDoc | null>(null);
  const [answers, setAnswers] = useState<EngawaAnswerDoc[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    const u1 = subscribeEngawaPost(postId, setPost);
    const u2 = subscribeEngawaAnswers(postId, setAnswers);
    return () => { u1(); u2(); };
  }, [postId]);

  const handleSubmit = async () => {
    if (!text.trim() || submitting || submitted) return;
    setSubmitting(true);
    try {
      await addEngawaAnswer(postId, text.trim(), uid);
      setSubmitted(true);
      setText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  const color = GENRE_COLORS[post.question.genre] ?? "#B6AC97";

  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[20px]">
      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[14px] flex items-center gap-[12px]">
        <button
          onClick={() => router.back()}
          className="grid place-items-center bg-white"
          style={{ width: 38, height: 38, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)", flexShrink: 0 }}
          aria-label="戻る"
        >
          <Icon name="back" size={18} color="#1A1714" />
        </button>
        <div className="flex-1">
          <p className="font-gothic text-sub" style={{ fontSize: 11 }}>縁側</p>
          <p className="font-mincho font-bold text-[#1A1714]" style={{ fontSize: 17 }}>お題に回答する</p>
        </div>
      </div>

      {/* お題カード */}
      <div
        className="mx-[20px] mb-[18px]"
        style={{ borderRadius: 20, padding: "18px 18px", background: "linear-gradient(140deg,#2BA35F,#1F8A4F)" }}
      >
        <div className="flex items-center gap-[8px] mb-2">
          <span
            className="font-gothic font-extrabold"
            style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: "rgba(255,255,255,.2)", color: "#fff" }}
          >
            {post.question.genre}
          </span>
          <span className="font-gothic" style={{ fontSize: 10, color: "rgba(255,255,255,.7)" }}>{post.question.difficulty}</span>
        </div>
        <p className="font-mincho font-extrabold text-white" style={{ fontSize: 22, lineHeight: 1.5 }}>
          {post.question.text}
        </p>
        <p className="font-gothic mt-2" style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>
          {post.answerCount}件の回答
        </p>
      </div>

      {/* 回答リスト */}
      <div className="flex-1 px-[20px] flex flex-col gap-[9px]">
        {answers.length > 0 && (
          <>
            <p className="font-gothic font-extrabold text-sub" style={{ fontSize: 12 }}>みんなの回答</p>
            {answers.map((a, i) => (
              <div
                key={a.id}
                className="bg-white"
                style={{ borderRadius: 15, padding: "12px 14px", border: "1px solid rgba(0,0,0,.07)" }}
              >
                <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 15, lineHeight: 1.5 }}>
                  {a.text}
                </p>
                <p className="font-gothic text-sub mt-1" style={{ fontSize: 10 }}>回答 {String.fromCharCode(65 + i)}</p>
              </div>
            ))}
          </>
        )}

        {/* 回答入力 */}
        <div className="mt-3">
          <label className="font-gothic font-extrabold text-sub" style={{ fontSize: 12 }}>あなたの回答</label>
          {submitted ? (
            <div
              className="mt-2 bg-white text-center animate-rise"
              style={{ borderRadius: 18, padding: 20, border: "2px solid #2BA35F" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2BA35F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2">
                <path d="M5 13l5 5L19 6"/>
              </svg>
              <p className="font-gothic font-bold text-[#2BA35F]" style={{ fontSize: 14 }}>回答を投じました</p>
              <button
                className="mt-3 font-gothic text-sub active:opacity-70"
                style={{ fontSize: 12 }}
                onClick={() => setSubmitted(false)}
              >
                もう一度回答する
              </button>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                className="bg-white font-gothic font-semibold text-[#1A1714] outline-none resize-none w-full"
                style={{
                  borderRadius: 18, padding: "14px 16px", fontSize: 16, lineHeight: 1.6,
                  border: "1.5px solid #E0A93B", minHeight: 100,
                }}
                placeholder="面白い回答を入力…"
                maxLength={40}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex justify-between items-center font-gothic text-sub" style={{ fontSize: 11 }}>
                <span>記名なしで投稿されます</span>
                <span>{text.length} / 40</span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitting}
                className="w-full font-mincho font-extrabold text-paper disabled:opacity-40 active:scale-[0.98] transition-all"
                style={{ fontSize: 18, padding: "15px 0", borderRadius: 18, background: "#E5402F", boxShadow: "0 14px 26px -10px rgba(229,64,47,0.6)" }}
              >
                {submitting ? "送信中…" : "回答を投じる"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
