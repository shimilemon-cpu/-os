"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getRoom } from "@/lib/ogiri/rooms";

export default function InvitePage() {
  const { id: roomId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code");

  const [inviteCode, setInviteCode] = useState(codeFromUrl ?? "");
  const [roomName, setRoomName] = useState("");
  const [copied, setCopied] = useState(false);
  const lineOpenedRef = useRef(false);

  useEffect(() => {
    if (codeFromUrl) return;
    getRoom(roomId).then((r) => {
      if (r) {
        setInviteCode(r.inviteCode);
        setRoomName(r.name);
      }
    });
  }, [roomId, codeFromUrl]);

  // ルーム作成直後（?code= あり）かつモバイルのみ LINE を自動起動
  useEffect(() => {
    if (!codeFromUrl || lineOpenedRef.current) return;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;
    lineOpenedRef.current = true;
    const link = `${window.location.origin}/invite/${codeFromUrl}`;
    const text = `大喜利Pocketで遊ぼう！\nあいことば：${codeFromUrl}\n↓タップして参加\n${link}`;
    window.location.href = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
  }, [codeFromUrl]);

  const inviteLink = inviteCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${inviteCode}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareText = `大喜利Pocketで遊ぼう！\nあいことば：${inviteCode}\n↓タップして参加\n${inviteLink}`;

  const shareViaLine = () => {
    window.open(
      `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: "大喜利Pocket", text: shareText, url: inviteLink });
    } else {
      await copyLink();
    }
  };

  if (!inviteCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="w-8 h-8 rounded-full border-2 border-pop-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-5 pt-10 pb-12 bg-ink">
      {/* 上部 */}
      <div className="text-center mb-8 animate-pop-in">
        <svg className="w-20 h-22 mx-auto mb-3 animate-floaty" style={{ "--r": "-4deg" } as React.CSSProperties}>
          <use href="#c-cat" width="100%" height="100%"/>
        </svg>
        <p className="text-text-muted text-sm mb-1">部屋を立てました</p>
        {roomName && (
          <h1 className="font-display text-text text-2xl font-bold">{roomName}</h1>
        )}
      </div>

      {/* あいことばカード */}
      <div className="bg-surface rounded-3xl p-7 mb-5 text-center animate-rise" style={{ border: "1px solid rgba(0,0,0,.07)" }}>
        <p className="text-[11px] text-text-muted tracking-widest uppercase mb-3">あいことば</p>
        <div
          className="font-display text-4xl tracking-[0.3em] mb-5 font-bold"
          style={{ color: "#E5402F" }}
        >
          {inviteCode}
        </div>
        <div
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-xs"
          style={{ background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)", border: "1px dashed #E0A93B" }}
        >
          <svg className="w-8 h-5 flex-none">
            <use href="#c-koban" width="100%" height="100%"/>
          </svg>
          <span className="text-[#9A6410] font-bold">このことばを友達に教えると入れます</span>
        </div>
      </div>

      {/* シェアボタン */}
      <div className="space-y-3 mb-auto">
        <button
          onClick={shareViaLine}
          className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl text-sm active:scale-[0.98] transition-all text-white"
          style={{ background: "#06C755" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          LINEであいことば＋リンクを送る
        </button>

        <button
          onClick={share}
          className="w-full flex items-center justify-center gap-2 bg-surface py-3.5 rounded-2xl text-sm text-text active:scale-[0.98] transition-all font-medium"
          style={{ border: "1px solid rgba(0,0,0,.08)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/>
            <path d="M8.3 10.7 15.7 6.3M8.3 13.3l7.4 4.4"/>
          </svg>
          その他のアプリでシェア
        </button>

        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 bg-surface py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-all font-medium"
          style={{ border: "1px solid rgba(0,0,0,.08)", color: copied ? "#2BA35F" : "#1A1714" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {copied
              ? <path d="M5 13l5 5L19 6"/>
              : <><rect x="4" y="4" width="11" height="11" rx="2.5"/><rect x="9" y="9" width="11" height="11" rx="2.5"/></>
            }
          </svg>
          {copied ? "コピーしました！" : "リンクをコピー"}
        </button>
      </div>

      {/* ロビーへ */}
      <Link
        href={`/rooms/${roomId}`}
        prefetch={true}
        className="mt-8 w-full text-center text-text-muted text-sm py-3 active:text-text transition-colors block"
      >
        友達を待ちながらロビーへ進む →
      </Link>
    </div>
  );
}
