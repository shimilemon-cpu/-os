"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { subscribeUserRooms } from "@/lib/ogiri/rooms";
import type { RoomDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";

const STATUS_LABEL: Record<string, string> = {
  waiting: "受付中",
  active: "回答中",
  voting: "投票中",
  finished: "終了",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  waiting:  { bg: "#EFE8DA", color: "#7A6F5C" },
  active:   { bg: "#E6F5EC", color: "#2BA35F" },
  voting:   { bg: "#FFF3E0", color: "#E07B2B" },
  finished: { bg: "#EFE8DA", color: "#B6AC97" },
};

const CHARM_NAMES = ["cat", "tai", "fuku", "daruma", "mask"] as const;

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.waiting;
  return (
    <span
      className="font-gothic font-extrabold shrink-0"
      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: s.bg, color: s.color }}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function RoomCard({ room }: { room: RoomDoc }) {
  const idx = Math.abs(room.id.charCodeAt(0)) % CHARM_NAMES.length;
  const charm = CHARM_NAMES[idx];
  const isWaiting = room.status === "waiting";

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="bg-white flex gap-[14px] items-center active:scale-[0.98] transition-transform"
      style={{ borderRadius: 18, border: "1px solid rgba(0,0,0,.07)", padding: "16px", boxShadow: "0 2px 8px rgba(40,30,10,.04)" }}
    >
      <div className="shrink-0 grid place-items-center" style={{ width: 52, height: 52, borderRadius: 16, background: "#F0EBE0" }}>
        <Engimono name={charm} width={30} height={34} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-gothic font-extrabold text-[#1A1714] truncate" style={{ fontSize: 15 }}>{room.name}</span>
          <StatusPill status={room.status} />
        </div>
        <p className="font-gothic text-[#52493A] line-clamp-1" style={{ fontSize: 12, marginTop: 2 }}>
          {isWaiting ? "まもなく開始・ホストが入室を待っています" : "ゲーム進行中"}
        </p>
        <p className="font-gothic text-sub2" style={{ fontSize: 11, marginTop: 3 }}>
          {room.memberIds.length}人参加{isWaiting ? `・あと${(room.capacity ?? 5) - room.memberIds.length}人` : ""}
        </p>
      </div>
      <span
        className="font-gothic font-extrabold shrink-0"
        style={{
          fontSize: 12, padding: "10px 18px", borderRadius: 999,
          background: isWaiting ? "#2BA35F" : "#1A1714",
          color: "#FBF7EC",
        }}
      >
        {isWaiting ? "参加" : "入室"}
      </span>
    </Link>
  );
}

function RoomsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white animate-pulse" style={{ borderRadius: 18, height: 88, border: "1px solid rgba(0,0,0,.07)" }} />
      ))}
    </>
  );
}

export default function RoomListClient() {
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    let roomsUnsub: (() => void) | undefined;
    let resolved = false;
    const subscribe = (uid: string) => {
      if (roomsUnsub) return;
      roomsUnsub = subscribeUserRooms(uid, (r) => { setRooms(r); setLoading(false); }, () => setLoading(false));
    };
    if (auth.currentUser) {
      resolved = true;
      subscribe(auth.currentUser.uid);
    } else {
      auth.authStateReady().then(() => {
        resolved = true;
        if (auth.currentUser) {
          subscribe(auth.currentUser.uid);
        } else {
          setLoading(false);
        }
      });
    }
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (!resolved) return;
      if (user) subscribe(user.uid);
    });
    return () => { authUnsub(); roomsUnsub?.(); };
  }, []);

  const activeRooms = rooms.filter((r) => r.status !== "finished");
  const finishedRooms = rooms.filter((r) => r.status === "finished");
  const displayed = tab === 0 ? activeRooms : finishedRooms;

  return (
    <>
      {/* Segmented control */}
      <div className="px-[20px] pb-[16px]">
        <div className="flex gap-[4px] p-[4px]" style={{ background: "#EBE2CF", borderRadius: 14 }}>
          {["開演中", "のれん履歴"].map((label, i) => (
            <button
              key={i}
              onClick={() => setTab(i)}
              className="flex-1 text-center font-gothic"
              style={{
                fontSize: 13, padding: "10px 0", borderRadius: 11,
                background: tab === i ? "#1A1714" : "transparent",
                color: tab === i ? "#FBF7EC" : "#7A6F5C",
                fontWeight: tab === i ? 700 : 600,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 px-[20px] pb-[14px] flex flex-col gap-[10px]">
        {loading ? (
          <RoomsSkeleton />
        ) : displayed.length > 0 ? (
          displayed.map((room) => <RoomCard key={room.id} room={room} />)
        ) : (
          <div
            className="text-center py-8 mt-2 flex flex-col items-center"
            style={{ borderRadius: 20, border: "1.5px dashed rgba(0,0,0,.12)", background: "rgba(255,255,255,.4)" }}
          >
            <Engimono name="daruma" width={54} height={60} className="mb-2" style={{ opacity: 0.35 }} />
            <p className="font-mincho font-extrabold text-[#1A1714] mb-1" style={{ fontSize: 15 }}>まだ部屋がありません</p>
            <p className="font-gothic text-sub mb-3" style={{ fontSize: 11 }}>下のボタンから部屋を立てて<br/>友達を呼びましょう</p>
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
    </>
  );
}
