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

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [loading, setLoading] = useState(true);
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
  const displayed = tab === 0 ? activeRooms : finishedRooms;

  return (
    <div className="min-h-screen flex flex-col bg-paper bg-asanoha pb-[78px]">
      {/* ハッシュタグレール（走馬灯） */}
      <div className="w-full overflow-hidden" style={{ height: 22, background: "linear-gradient(90deg,#E5402F,#F0922B)" }}>
        <div
          className="whitespace-nowrap font-gothic font-extrabold text-paper"
          style={{ fontSize: 11, letterSpacing: "0.24em", padding: "3px 0", animation: "railleft 20s linear infinite", display: "inline-block" }}
        >
          ＃笑門来福　＃本日も大入　＃珍回答歓迎　＃座布団一枚　＃笑門来福　＃本日も大入　＃珍回答歓迎　＃座布団一枚
        </div>
      </div>

      {/* AppBar */}
      <div className="px-[20px] pt-[10px] pb-[10px] flex items-center gap-[12px]">
        <div className="relative">
          <Engimono name="daruma" width={44} height={48} />
          <span
            className="absolute font-mincho font-extrabold"
            style={{ top: -4, right: -4, fontSize: 8, padding: "1px 5px", borderRadius: 999, background: "#2BA35F", color: "#FBF7EC" }}
          >
            開演中
          </span>
        </div>
        <div className="flex-1">
          <p className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 22, lineHeight: 1.1 }}>寄合所</p>
          <p className="font-gothic text-sub" style={{ fontSize: 10.5 }}>いま笑いが生まれる場所</p>
        </div>
        <Link
          href="/rooms/new"
          className="grid place-items-center bg-white"
          style={{ width: 38, height: 38, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
          aria-label="部屋を立てる"
        >
          <Icon name="plus" size={17} color="#1A1714" strokeWidth={2.2} />
        </Link>
      </div>

      {/* Segmented control */}
      <div className="mx-[20px] mb-[12px] flex gap-[4px] p-[4px]" style={{ background: "#EBE2CF", borderRadius: 14 }}>
        {["開演中", "のれん履歴"].map((label, i) => (
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

      {/* セクションラベル */}
      <div className="px-[20px] flex items-center gap-[8px] mt-[4px] mb-[8px]">
        <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
        <p className="font-mincho font-extrabold text-sub" style={{ fontSize: 11, letterSpacing: "0.16em" }}>
          {tab === 0 ? "◆ 開演中の部屋" : "◆ のれん履歴"}
        </p>
        <span style={{ height: 1, flex: 1, background: "rgba(0,0,0,.1)" }} />
      </div>

      {/* Room list */}
      <div className="flex-1 px-[20px] pb-[14px] flex flex-col gap-[10px]">
        {/* あいことばで入室カード */}
        <Link
          href="/rooms/join"
          className="bg-white flex gap-[13px] items-center active:scale-[0.98] transition-transform"
          style={{ borderRadius: 18, border: "1.5px dashed #E0A93B", padding: "14px", background: "linear-gradient(100deg,#FFFDF5,#FFF9E8)" }}
        >
          <div
            className="shrink-0 grid place-items-center"
            style={{ width: 54, height: 54, borderRadius: 16, background: "linear-gradient(135deg,#FFF7E0,#FCEAC6)" }}
          >
            <Engimono name="koban" width={22} height={34} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-gothic font-extrabold text-[#1A1714]" style={{ fontSize: 15 }}>あいことばで入室</p>
            <p className="font-gothic text-[#9A6410]" style={{ fontSize: 12 }}>合言葉を持っている方はこちら</p>
          </div>
          <span
            className="font-gothic font-extrabold shrink-0"
            style={{ fontSize: 12, padding: "8px 13px", borderRadius: 999, background: "#E5402F", color: "#FBF7EC" }}
          >
            入室
          </span>
        </Link>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 rounded-full border-2 border-red border-t-transparent animate-spin" />
          </div>
        ) : displayed.length > 0 ? (
          displayed.map((room) => <RoomCard key={room.id} room={room} />)
        ) : (
          <div
            className="text-center py-8 mt-2 flex flex-col items-center"
            style={{ borderRadius: 20, border: "1.5px dashed rgba(0,0,0,.12)", background: "rgba(255,255,255,.4)" }}
          >
            <Engimono name="daruma" width={54} height={60} className="mb-2" style={{ opacity: 0.35 }} />
            <p className="font-mincho font-extrabold text-[#1A1714] mb-1" style={{ fontSize: 15 }}>まだ部屋がありません</p>
            <p className="font-gothic text-sub mb-3" style={{ fontSize: 11 }}>右下のボタンから部屋を立てて<br/>友達を呼びましょう</p>
            <Link
              href="/rooms/new"
              className="font-gothic font-extrabold text-paper"
              style={{ fontSize: 12, padding: "8px 14px", borderRadius: 999, background: "#E5402F" }}
            >
              ＋ 部屋を立てる
            </Link>
          </div>
        )}
      </div>

      {/* AD placeholder */}
      <div className="mx-[20px] mb-[14px]">
        <div
          className="flex items-center justify-center font-gothic text-sub"
          style={{ height: 60, borderRadius: 12, border: "1.5px dashed rgba(0,0,0,.12)", fontSize: 12 }}
        >
          AD
        </div>
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
