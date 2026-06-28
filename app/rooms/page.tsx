"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { subscribeUserRooms } from "@/lib/ogiri/rooms";
import type { RoomDoc } from "@/lib/types";
import Mascot from "@/components/Mascot";
import AdSlot from "@/components/AdSlot";

const STATUS_LABEL: Record<RoomDoc["status"], string> = {
  waiting: "待機中",
  active: "ゲーム中",
  finished: "終了",
};
const STATUS_COLOR: Record<RoomDoc["status"], string> = {
  waiting: "#3DDC84",
  active: "#FFD600",
  finished: "#525252",
};

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsub = subscribeUserRooms(user.uid, (r) => {
      setRooms(r);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen pb-24 px-4 pt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-pop-yellow text-2xl">大喜利Pocket</h1>
          <p className="text-zinc-500 text-xs mt-0.5">AIがあなたたちの笑いを覚える</p>
        </div>
        <Link
          href="/rooms/new"
          className="flex items-center gap-1.5 bg-pop-yellow text-ink text-sm font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
        >
          <Mascot kind="plus" size={14} tint="#0d0d0d" />
          作成
        </Link>
      </div>

      {/* Invite code join */}
      <JoinByCode onJoined={(id) => router.push(`/rooms/${id}`)} />

      <AdSlot id="rooms-banner" className="mt-6" />

      <h2 className="text-zinc-600 text-xs tracking-widest uppercase mt-6 mb-3">
        参加中のルーム
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Mascot kind="mic" size={48} tint="#262626" className="mx-auto" />
          <p className="text-zinc-500 text-sm">まだルームがありません</p>
          <Link
            href="/rooms/new"
            className="inline-flex items-center gap-2 border border-pop-yellow/40 text-pop-yellow text-sm px-5 py-2.5 rounded-full"
          >
            <Mascot kind="plus" size={14} tint="#FFD600" />
            ルームを作る
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="flex items-center justify-between bg-surface border border-line rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform animate-rise"
              >
                <div className="space-y-1">
                  <p className="text-white font-medium">{room.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      <Mascot kind="person" size={11} tint="#737373" />
                      {room.memberIds.length}人
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: STATUS_COLOR[room.status] }}
                    >
                      ● {STATUS_LABEL[room.status]}
                    </span>
                  </div>
                </div>
                <Mascot kind="bars" size={18} tint="#525252" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JoinByCode({ onJoined }: { onJoined: (roomId: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (code.length < 6) return;
    setLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("未ログイン");
      const { joinRoomByCode } = await import("@/lib/ogiri/rooms");
      const { getDoc, doc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/client");
      const roomId = await joinRoomByCode(code, user.uid, user.displayName ?? "ゲスト");
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
        const { setDoc, Timestamp } = await import("firebase/firestore");
        await setDoc(doc(db, "users", user.uid), {
          nickname: user.displayName ?? "ゲスト",
          avatarUrl: user.photoURL ?? null,
          createdAt: Timestamp.now(),
        });
      }
      onJoined(roomId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "参加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-2xl p-4 space-y-3">
      <p className="text-xs text-zinc-500 tracking-wide">招待コードで参加</p>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-white text-sm uppercase tracking-widest placeholder:text-zinc-600 outline-none focus:border-pop-yellow/60 transition-colors"
          placeholder="ABC123"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && join()}
        />
        <button
          onClick={join}
          disabled={code.length < 6 || loading}
          className="bg-pop-yellow text-ink text-sm font-bold px-5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? "..." : "参加"}
        </button>
      </div>
      {error && <p className="text-xs text-pop-pink">{error}</p>}
    </div>
  );
}
