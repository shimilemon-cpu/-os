"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { subscribeUserRooms } from "@/lib/ogiri/rooms";
import type { RoomDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";

const STATUS_LABEL: Record<string, string> = {
  waiting: "受付中",
  active: "回答中",
  finished: "終了",
};

const CHARM_NAMES = ["cat", "tai", "fuku", "daruma", "mask"] as const;
const CHARM_BG = ["#EAF7EF", "#FDEFE0", "#FFF3D6", "#EAF7EF", "#FCE8E3"] as const;

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    waiting: { bg: "#EFE8DA", color: "#7A6F5C" },
    active:  { bg: "#E6F5EC", color: "#2BA35F" },
    finished:{ bg: "#EFE8DA", color: "#B6AC97" },
  };
  const s = styles[status] ?? styles.waiting;
  return (
    <span
      className="font-maru font-black"
      style={{ fontSize: 10, padding: "2px 7px", borderRadius: 999, background: s.bg, color: s.color }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function RoomCard({ room }: { room: RoomDoc }) {
  const idx = Math.abs(room.id.charCodeAt(0)) % CHARM_NAMES.length;
  const charm = CHARM_NAMES[idx];
  const bg = CHARM_BG[idx];
  const isActive = room.status !== "waiting" && room.status !== "finished";

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="bg-white flex gap-[13px] items-start active:scale-[0.98] transition-transform"
      style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)", padding: "14px" }}
    >
      <div className="shrink-0 grid place-items-center" style={{ width: 54, height: 54, borderRadius: 16, background: bg }}>
        <Engimono name={charm} width={42} height={46} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 15 }}>{room.name}</p>
          <StatusPill status={room.status} />
        </div>
        <p className="font-gothic text-[#52493A] line-clamp-2" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          {room.status === "waiting" ? "まもなく開始…" : "ゲーム進行中"}
        </p>
        <p className="font-gothic text-sub mt-[7px]" style={{ fontSize: 11 }}>
          {room.memberIds.length}人参加
        </p>
      </div>
      <button
        className="font-gothic font-extrabold self-center"
        style={{
          fontSize: 12, padding: "8px 13px", borderRadius: 999,
          background: isActive ? "#1A1714" : "#2BA35F",
          color: "#FBF7EC",
        }}
      >
        入室
      </button>
    </Link>
  );
}

function JoinByCode({ onJoined }: { onJoined: (id: string) => void }) {
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
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, "users", user.uid), { nickname: user.displayName ?? "ゲスト", avatarUrl: user.photoURL ?? null, createdAt: Timestamp.now() });
      }
      onJoined(roomId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "参加に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[16px] p-4 space-y-2 animate-rise" style={{ border: "1px solid rgba(0,0,0,.07)" }}>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-[12px] px-4 py-2.5 font-gothic text-[#1A1714] text-sm uppercase tracking-widest outline-none"
          style={{ background: "#EBE2CF", border: "1px solid rgba(0,0,0,.07)" }}
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
          className="font-gothic font-extrabold text-paper disabled:opacity-40"
          style={{ fontSize: 13, padding: "0 16px", borderRadius: 12, background: "#E5402F" }}
        >
          {loading ? "…" : "入る"}
        </button>
      </div>
      {error && <p className="text-red text-xs font-gothic">{error}</p>}
    </div>
  );
}

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    let roomsUnsub: (() => void) | undefined;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (!user) { setLoading(false); return; }
      roomsUnsub = subscribeUserRooms(user.uid, (r) => { setRooms(r); setLoading(false); }, () => setLoading(false));
    });
    return () => { authUnsub(); roomsUnsub?.(); };
  }, []);

  const activeRooms = rooms.filter((r) => r.status !== "finished");
  const finishedRooms = rooms.filter((r) => r.status === "finished");
  const displayed = tab === 2 ? finishedRooms : tab === 0 ? activeRooms : [];

  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[78px]">
      {/* AppBar */}
      <div className="px-[20px] pt-[6px] pb-[16px] flex items-center gap-[12px]">
        <Engimono name="daruma" width={40} height={44} />
        <div className="flex-1">
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 21 }}>寄合所</p>
          <p className="font-gothic text-sub" style={{ fontSize: 11 }}>いま笑いが生まれる場所</p>
        </div>
        <button
          className="grid place-items-center bg-white"
          style={{ width: 40, height: 40, borderRadius: 14, border: "1px solid rgba(0,0,0,.07)" }}
          onClick={() => setShowJoin((v) => !v)}
          aria-label="あいことばで検索"
        >
          <Icon name="search" size={18} color="#1A1714" strokeWidth={2.2} />
        </button>
      </div>

      {/* Segmented control */}
      <div className="mx-[20px] mb-[14px] flex gap-[4px] p-[4px]" style={{ background: "#EBE2CF", borderRadius: 14 }}>
        {["公開の間", "仲間内", "のれん履歴"].map((label, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className="flex-1 text-center font-gothic"
            style={{
              fontSize: 13, padding: "8px 0", borderRadius: 11,
              background: tab === i ? "#1A1714" : "transparent",
              color: tab === i ? "#FBF7EC" : "#7A6F5C",
              fontWeight: tab === i ? 700 : 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Aikotoba card */}
      <div
        className="mx-[20px] mb-[12px] flex gap-[10px] items-center"
        style={{ background: "linear-gradient(100deg,#FFF7E0,#FCEAC6)", border: "1.5px dashed #E0A93B", borderRadius: 16, padding: "12px 14px" }}
      >
        <Engimono name="koban" width={34} height={22} />
        <button className="flex-1 text-left" onClick={() => setShowJoin((v) => !v)}>
          <p className="font-gothic font-bold text-[#9A6410]" style={{ fontSize: 11 }}>あいことばで入る</p>
          <p className="font-gothic text-sub" style={{ fontSize: 13 }}>4文字の合言葉を入力…</p>
        </button>
        <button
          onClick={() => setShowJoin((v) => !v)}
          className="font-gothic font-extrabold text-paper"
          style={{ fontSize: 12, padding: "7px 12px", borderRadius: 999, background: "#E5402F" }}
        >
          入る
        </button>
      </div>

      {showJoin && (
        <div className="mx-[20px] mb-[12px] animate-rise">
          <JoinByCode onJoined={(id) => router.push(`/rooms/${id}`)} />
        </div>
      )}

      {/* Room list */}
      <div className="flex-1 px-[20px] pb-[14px] flex flex-col gap-[12px]">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-red border-t-transparent animate-spin" />
          </div>
        ) : displayed.length > 0 ? (
          displayed.map((room) => <RoomCard key={room.id} room={room} />)
        ) : (
          <div className="text-center py-12">
            <Engimono name="daruma" width={64} height={70} className="mx-auto mb-3 opacity-30" />
            <p className="font-gothic text-sub" style={{ fontSize: 14 }}>まだ部屋がありません</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <Link
        href="/rooms/new"
        className="fixed flex items-center gap-[9px] font-gothic font-extrabold text-paper"
        style={{
          right: 22, bottom: 96, fontSize: 14, padding: "13px 18px",
          borderRadius: 999, background: "#E5402F",
          boxShadow: "0 14px 26px -10px rgba(229,64,47,0.6)",
        }}
      >
        ＋部屋を立てる
      </Link>
    </div>
  );
}
