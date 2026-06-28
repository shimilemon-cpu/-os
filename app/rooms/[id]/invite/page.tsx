"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getRoom } from "@/lib/ogiri/rooms";
import type { RoomDoc } from "@/lib/types";
import Mascot from "@/components/Mascot";

export default function InvitePage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();
  const [room, setRoom] = useState<RoomDoc | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getRoom(roomId).then(setRoom);
  }, [roomId]);

  const inviteLink = room
    ? `${window.location.origin}/invite/${room.inviteCode}`
    : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "大喜利Pocket",
        text: `「${room?.name}」に参加しよう！`,
        url: inviteLink,
      });
    } else {
      await copyLink();
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="w-8 h-8 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-16 pb-12 bg-ink">
      {/* 上部 */}
      <div className="text-center mb-12 animate-pop-in">
        <div className="flex justify-center mb-4">
          <Mascot kind="mic" size={52} tint="#FFD600" className="animate-floaty" />
        </div>
        <p className="text-zinc-500 text-sm mb-1">ルームを作成しました</p>
        <h1 className="font-display text-white text-2xl">{room.name}</h1>
      </div>

      {/* 招待コード */}
      <div className="bg-surface border border-line rounded-3xl p-8 mb-6 text-center animate-rise">
        <p className="text-xs text-zinc-500 tracking-widest uppercase mb-4">招待コード</p>
        <p className="font-display text-5xl tracking-[0.5em] text-pop-yellow mb-6">
          {room.inviteCode}
        </p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          このコードを友達に教えると<br />「招待コードで参加」から入れます
        </p>
      </div>

      {/* シェアボタン */}
      <div className="space-y-3 mb-auto">
        <button
          onClick={share}
          className="w-full flex items-center justify-center gap-2 bg-pop-yellow text-ink font-bold py-4 rounded-2xl text-base active:scale-[0.98] transition-all"
        >
          <Mascot kind="link" size={18} tint="#0d0d0d" />
          友達にシェア
        </button>

        <button
          onClick={copyLink}
          className="w-full flex items-center justify-center gap-2 bg-surface border border-line text-white py-3.5 rounded-2xl text-sm active:scale-[0.98] transition-all"
        >
          <Mascot kind={copied ? "check" : "copy"} size={16} tint={copied ? "#3DDC84" : "#ffffff"} />
          {copied ? "コピーしました！" : "リンクをコピー"}
        </button>
      </div>

      {/* ロビーへ */}
      <Link
        href={`/rooms/${roomId}`}
        className="mt-8 w-full text-center text-zinc-500 text-sm py-3 active:text-white transition-colors block"
        prefetch={true}
      >
        友達を待ちながらロビーへ進む →
      </Link>
    </div>
  );
}
