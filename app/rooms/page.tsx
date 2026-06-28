"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
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
  const [showJoin, setShowJoin] = useState(false);

  useEffect(() => {
    let roomsUnsub: (() => void) | undefined;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (!user) { setLoading(false); return; }
      roomsUnsub = subscribeUserRooms(
        user.uid,
        (r) => { setRooms(r); setLoading(false); },
        () => setLoading(false),
      );
    });
    return () => { authUnsub(); roomsUnsub?.(); };
  }, []);

  const activeRooms = rooms.filter((r) => r.status !== "finished");
  const finishedRooms = rooms.filter((r) => r.status === "finished");

  return (
    <div className="min-h-screen pb-24 px-4 pt-12">
      {/* Brand */}
      <div className="text-center mb-10">
        <div className="flex justify-center gap-2 mb-3">
          <Mascot kind="char_yellow" size={36} className="animate-floaty" style={{ "--r": "-6deg" } as React.CSSProperties} />
          <Mascot kind="char_pink" size={36} className="animate-floaty" style={{ "--r": "4deg", animationDelay: "0.6s" } as React.CSSProperties} />
          <Mascot kind="char_teal" size={36} className="animate-floaty" style={{ "--r": "-3deg", animationDelay: "1.1s" } as React.CSSProperties} />
        </div>
        <h1 className="font-display text-pop-yellow text-2xl">大喜利Pocket</h1>
        <p className="text-zinc-600 text-xs mt-1">AIがあなたたちの笑いを覚える</p>
      </div>

      {/* Main CTAs */}
      <div className="space-y-3 mb-8">
        <Link
          href="/rooms/new"
          className="flex items-center justify-between w-full bg-pop-yellow text-ink px-5 py-4 rounded-2xl active:scale-[0.98] transition-all animate-pulse-glow"
        >
          <div>
            <p className="font-display text-lg">ルームを作る</p>
            <p className="text-xs opacity-70 mt-0.5">友達を招待して始める</p>
          </div>
          <Mascot kind="plus" size={28} tint="#0d0d0d" />
        </Link>

        <button
          onClick={() => setShowJoin((v) => !v)}
          className="flex items-center justify-between w-full bg-surface border border-line px-5 py-4 rounded-2xl active:scale-[0.98] transition-all"
        >
          <div className="text-left">
            <p className="font-bold text-white text-base">招待コードで参加</p>
            <p className="text-xs text-zinc-500 mt-0.5">友達のルームに入る</p>
          </div>
          <Mascot kind="link" size={22} tint="#737373" />
        </button>

        {showJoin && (
          <div className="animate-rise">
            <JoinByCode onJoined={(id) => router.push(`/rooms/${id}`)} />
          </div>
        )}
      </div>

      <AdSlot id="rooms-banner" className="mb-6" />

      {/* Active rooms */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-pop-yellow border-t-transparent animate-spin" />
        </div>
      ) : activeRooms.length > 0 ? (
        <div className="mb-6">
          <h2 className="text-zinc-500 text-xs tracking-widest uppercase mb-3">参加中のルーム</h2>
          <ul className="space-y-2">
            {activeRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </ul>
        </div>
      ) : !loading ? (
        <div className="text-center py-10">
          <Mascot kind="mic" size={40} tint="#262626" className="mx-auto mb-3" />
          <p className="text-zinc-600 text-sm">まだルームがありません</p>
        </div>
      ) : null}

      {/* Finished rooms */}
      {finishedRooms.length > 0 && (
        <div>
          <h2 className="text-zinc-600 text-xs tracking-widest uppercase mb-3">過去のルーム</h2>
          <ul className="space-y-2">
            {finishedRooms.slice(0, 3).map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RoomCard({ room }: { room: RoomDoc }) {
  return (
    <li>
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
            <span className="text-xs font-bold" style={{ color: STATUS_COLOR[room.status] }}>
              ● {STATUS_LABEL[room.status]}
            </span>
          </div>
        </div>
        <Mascot kind="bars" size={18} tint="#525252" />
      </Link>
    </li>
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
      const { getDoc, doc, setDoc, Timestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/client");
      const roomId = await joinRoomByCode(code, user.uid, user.displayName ?? "ゲスト");
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
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
    <div className="bg-surface-2 border border-line rounded-2xl p-4 space-y-3">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-surface border border-line rounded-xl px-4 py-2.5 text-white text-sm uppercase tracking-widest placeholder:text-zinc-600 outline-none focus:border-pop-yellow/60 transition-colors"
          placeholder="ABC123"
          maxLength={6}
          value={code}
          autoFocus
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
