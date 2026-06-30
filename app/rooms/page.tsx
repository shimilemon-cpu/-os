"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { subscribeUserRooms } from "@/lib/ogiri/rooms";
import type { RoomDoc } from "@/lib/types";
import AdSlot from "@/components/AdSlot";

const STATUS_LABEL: Record<RoomDoc["status"], string> = {
  waiting: "受付中",
  active: "回答中",
  finished: "終了",
};
const STATUS_COLOR: Record<RoomDoc["status"], string> = {
  waiting: "#2BA35F",
  active: "#E5402F",
  finished: "#B6AC97",
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
    <div className="min-h-screen pb-24 bg-ink">
      {/* App bar */}
      <div className="px-5 pt-12 pb-3 flex items-center gap-3">
        <svg className="w-10 h-11 flex-none">
          <use href="#c-daruma" width="100%" height="100%"/>
        </svg>
        <div className="flex-1">
          <h1 className="font-display text-text text-xl font-bold leading-tight">寄合所</h1>
          <p className="text-text-muted text-[11px] mt-0.5">いま笑いが生まれる場所</p>
        </div>
      </div>

      {/* あいことば入力 */}
      <div className="mx-5 mb-3">
        <button
          onClick={() => setShowJoin((v) => !v)}
          className="w-full flex items-center gap-3 rounded-2xl border border-dashed border-[#E0A93B] px-4 py-3"
          style={{ background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)" }}
        >
          <svg className="w-9 h-6 flex-none">
            <use href="#c-koban" width="100%" height="100%"/>
          </svg>
          <div className="flex-1 text-left">
            <p className="text-[11px] text-[#9A6410] font-bold">あいことばで入る</p>
            <p className="text-sm text-text-muted">4〜6文字の合言葉を入力…</p>
          </div>
          <span className="text-xs font-black text-[#FBF7EC] bg-pop-red px-3 py-1.5 rounded-full">入る</span>
        </button>

        {showJoin && (
          <div className="mt-2 animate-rise">
            <JoinByCode onJoined={(id) => router.push(`/rooms/${id}`)} />
          </div>
        )}
      </div>

      <AdSlot id="rooms-banner" className="mx-5 mb-3" />

      {/* Room list */}
      <div className="px-5 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-pop-red border-t-transparent animate-spin" />
          </div>
        ) : activeRooms.length > 0 ? (
          <>
            <p className="text-text-muted text-xs font-bold tracking-widest uppercase">参加中の部屋</p>
            {activeRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-18 mx-auto mb-3 opacity-30">
              <use href="#c-daruma" width="100%" height="100%"/>
            </svg>
            <p className="text-text-muted text-sm">まだ部屋がありません</p>
          </div>
        )}

        {finishedRooms.length > 0 && (
          <>
            <p className="text-text-faint text-xs font-bold tracking-widest uppercase pt-2">過去の部屋</p>
            {finishedRooms.slice(0, 3).map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/rooms/new"
        className="fixed right-5 bottom-8 flex items-center gap-2 text-[#FBF7EC] font-black text-sm px-5 py-3.5 rounded-full shadow-lg active:scale-95 transition-all"
        style={{ background: "#E5402F", boxShadow: "0 14px 26px -10px rgba(229,64,47,.7)" }}
      >
        <span className="text-lg leading-none">＋</span>部屋を立てる
      </Link>
    </div>
  );
}

function RoomCard({ room }: { room: RoomDoc }) {
  const charSymbols = ["#c-daruma", "#c-cat", "#c-tai", "#c-fuku", "#c-mask"];
  const symbol = charSymbols[Math.abs(room.id.charCodeAt(0)) % charSymbols.length];
  const bgColors = ["#EAF7EF", "#FDEFE0", "#FFF3D6", "#E8F4FD", "#FCE8E3"];
  const bgColor = bgColors[Math.abs(room.id.charCodeAt(0)) % bgColors.length];

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex items-center gap-3 bg-surface border border-line rounded-[18px] px-4 py-3.5 active:scale-[0.98] transition-transform animate-rise"
      style={{ borderColor: "rgba(0,0,0,.07)" }}
    >
      <div className="w-14 h-14 rounded-2xl flex-none grid place-items-center" style={{ background: bgColor }}>
        <svg className="w-10 h-11">
          <use href={symbol} width="100%" height="100%"/>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-text text-[15px]">{room.name}</p>
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full flex-none"
            style={{ color: STATUS_COLOR[room.status], background: `${STATUS_COLOR[room.status]}18` }}
          >
            {STATUS_LABEL[room.status]}
          </span>
        </div>
        <p className="text-text-muted text-[11px] mt-1">{room.memberIds.length}人参加</p>
      </div>
      <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
        <path d="M1 1l5 5-5 5" stroke="#B6AC97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}

function JoinByCode({ onJoined }: { onJoined: (roomId: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const join = async () => {
    if (code.length < 4) return;
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
    <div className="bg-surface border rounded-2xl p-4 space-y-3" style={{ borderColor: "rgba(0,0,0,.08)" }}>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-surface-2 border border-line rounded-xl px-4 py-2.5 text-text text-sm uppercase tracking-widest placeholder:text-text-faint outline-none focus:border-[#E0A93B] transition-colors"
          placeholder="あいことば"
          maxLength={6}
          value={code}
          autoFocus
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && join()}
        />
        <button
          onClick={join}
          disabled={code.length < 4 || loading}
          className="text-[#FBF7EC] text-sm font-black px-5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
          style={{ background: "#E5402F" }}
        >
          {loading ? "…" : "入る"}
        </button>
      </div>
      {error && <p className="text-xs text-pop-red">{error}</p>}
    </div>
  );
}
