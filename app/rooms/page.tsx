"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { subscribeUserRooms } from "@/lib/ogiri/rooms";
import type { RoomDoc } from "@/lib/types";
import { Plus, ChevronRight, Users } from "lucide-react";

const STATUS_LABEL: Record<RoomDoc["status"], string> = {
  waiting: "待機中",
  active: "ゲーム中",
  finished: "終了",
};
const STATUS_COLOR: Record<RoomDoc["status"], string> = {
  waiting: "var(--ok)",
  active: "var(--gold)",
  finished: "var(--muted)",
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="serif text-[var(--accent)] text-2xl font-bold">大喜利Pocket</h1>
          <p className="text-[var(--muted)] text-xs mt-0.5">AIがあなたたちの笑いを覚える</p>
        </div>
        <Link
          href="/rooms/new"
          className="flex items-center gap-1.5 bg-[var(--accent)] text-[var(--bg)] text-sm font-bold px-4 py-2 rounded-full active:scale-95 transition-transform"
        >
          <Plus size={16} />
          作成
        </Link>
      </div>

      {/* 招待コード入力 */}
      <JoinByCode onJoined={(id) => router.push(`/rooms/${id}`)} />

      <h2 className="text-[var(--muted)] text-xs tracking-widest uppercase mt-8 mb-3">
        参加中のルーム
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-[var(--muted)] text-sm">まだルームがありません</p>
          <Link
            href="/rooms/new"
            className="inline-flex items-center gap-2 border border-[var(--accent)]/40 text-[var(--accent)] text-sm px-5 py-2.5 rounded-full"
          >
            <Plus size={16} />
            ルームを作る
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <Link
                href={`/rooms/${room.id}`}
                className="flex items-center justify-between bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 py-3.5 active:scale-[0.98] transition-transform"
              >
                <div className="space-y-1">
                  <p className="text-[var(--text)] font-medium">{room.name}</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                      <Users size={11} />
                      {room.memberIds.length}人
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: STATUS_COLOR[room.status] }}
                    >
                      ● {STATUS_LABEL[room.status]}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[var(--muted)]" />
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
      // Ensure user doc exists
      const userSnap = await getDoc(doc(db, "users", user.uid));
      if (!userSnap.exists()) {
        const { setDoc } = await import("firebase/firestore");
        const { Timestamp } = await import("firebase/firestore");
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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      <p className="text-xs text-[var(--muted)] tracking-wide">招待コードで参加</p>
      <div className="flex gap-2">
        <input
          className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-[var(--text)] text-sm uppercase tracking-widest placeholder:text-[var(--placeholder)] outline-none focus:border-[var(--accent)]/60"
          placeholder="ABC123"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && join()}
        />
        <button
          onClick={join}
          disabled={code.length < 6 || loading}
          className="bg-[var(--accent)] text-[var(--bg)] text-sm font-bold px-5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? "..." : "参加"}
        </button>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}
