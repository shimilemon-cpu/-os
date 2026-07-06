"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  collection, getDocs, getDoc, query, orderBy, limit,
  doc, deleteDoc, updateDoc, Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { RoomDoc, UserDoc, AnswerDoc } from "@/lib/types";
import Engimono from "@/components/Engimono";
import Icon from "@/components/Icon";

type EngimonoName = "daruma" | "cat" | "tai" | "fuku" | "koban" | "mallet" | "mask" | "tanuki" | "kitsune" | "usagi";
type Tab = "stats" | "users" | "rooms" | "moderation";

const ADMIN_EMAILS = ["shimilemon@gmail.com"];

const TAB_LABELS: Record<Tab, string> = {
  stats: "統計",
  users: "ユーザー",
  rooms: "部屋管理",
  moderation: "モデレ",
};

interface AnswerItem {
  sessionId: string;
  roundId: string;
  answerId: string;
  text: string;
  userId: string;
  questionText: string;
  submittedAt: Timestamp | null;
}

function formatDate(ts: Timestamp | null): string {
  if (!ts) return "-";
  const d = ts.toDate();
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div
      className="bg-white flex-1 text-center"
      style={{ borderRadius: 14, padding: "14px 8px", border: "1px solid rgba(0,0,0,.07)" }}
    >
      <p className="font-mincho font-extrabold" style={{ fontSize: 26, color: color ?? "#1A1714" }}>{value}</p>
      <p className="font-gothic font-semibold text-sub" style={{ fontSize: 10, marginTop: 2 }}>{label}</p>
    </div>
  );
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  waiting:  { bg: "#EFE8DA", color: "#7A6F5C" },
  active:   { bg: "#E6F5EC", color: "#2BA35F" },
  finished: { bg: "#EFE8DA", color: "#B6AC97" },
};
const STATUS_LABEL: Record<string, string> = { waiting: "受付中", active: "進行中", finished: "終了" };

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("stats");

  const [users, setUsers] = useState<UserDoc[]>([]);
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [answers, setAnswers] = useState<AnswerItem[]>([]);
  const [userRoomCounts, setUserRoomCounts] = useState<Record<string, number>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersSnap, roomsSnap] = await Promise.all([
        getDocs(query(collection(db, "users"), limit(200))),
        getDocs(query(collection(db, "rooms"), limit(100))),
      ]);

      const usersList = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as UserDoc));
      const roomsList = roomsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomDoc));
      roomsList.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

      const counts: Record<string, number> = {};
      for (const room of roomsList) {
        for (const uid of room.memberIds) {
          counts[uid] = (counts[uid] ?? 0) + 1;
        }
      }

      setUsers(usersList);
      setRooms(roomsList);
      setUserRoomCounts(counts);

      const answerItems: AnswerItem[] = [];
      const sessionsSnap = await getDocs(query(collection(db, "sessions"), limit(30)));
      for (const sess of sessionsSnap.docs) {
        const roundsSnap = await getDocs(query(collection(db, "sessions", sess.id, "rounds"), limit(10)));
        for (const rd of roundsSnap.docs) {
          const rdData = rd.data();
          const answersSnap = await getDocs(collection(db, "sessions", sess.id, "rounds", rd.id, "answers"));
          for (const ans of answersSnap.docs) {
            const ansData = ans.data() as AnswerDoc;
            answerItems.push({
              sessionId: sess.id,
              roundId: rd.id,
              answerId: ans.id,
              text: ansData.text,
              userId: ansData.userId,
              questionText: rdData.question?.text ?? "",
              submittedAt: ansData.submittedAt ?? null,
            });
          }
        }
      }
      answerItems.sort((a, b) => (b.submittedAt?.seconds ?? 0) - (a.submittedAt?.seconds ?? 0));
      setAnswers(answerItems);
    } catch (e) {
      console.error("Admin load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    auth.authStateReady().then(() => {
      const user = auth.currentUser;
      if (!user) { router.push("/auth/login"); return; }
      const email = user.email?.toLowerCase();
      if (!email || !ADMIN_EMAILS.includes(email)) {
        router.push("/rooms");
        return;
      }
      setAuthorized(true);
      loadData();
    });
  }, [router, loadData]);

  const deleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`「${roomName}」を削除しますか？`)) return;
    try {
      await deleteDoc(doc(db, "rooms", roomId));
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (e) {
      console.error("Delete room failed:", e);
      alert("削除に失敗しました");
    }
  };

  const changeRoomStatus = async (roomId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "rooms", roomId), { status: newStatus });
      setRooms((prev) => prev.map((r) => r.id === roomId ? { ...r, status: newStatus as RoomDoc["status"] } : r));
    } catch (e) {
      console.error("Update status failed:", e);
      alert("更新に失敗しました");
    }
  };

  const deleteAnswer = async (item: AnswerItem) => {
    if (!confirm(`「${item.text}」を削除しますか？`)) return;
    try {
      await deleteDoc(doc(db, "sessions", item.sessionId, "rounds", item.roundId, "answers", item.answerId));
      setAnswers((prev) => prev.filter((a) => a.answerId !== item.answerId));
    } catch (e) {
      console.error("Delete answer failed:", e);
      alert("削除に失敗しました");
    }
  };

  const activeRooms = rooms.filter((r) => r.status === "active").length;
  const waitingRooms = rooms.filter((r) => r.status === "waiting").length;

  const getNickname = (uid: string) => users.find((u) => u.id === uid)?.nickname ?? uid.slice(0, 6);

  if (!authorized || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E5402F", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-paper pb-[100px]">
      {/* Header */}
      <div className="px-[20px] pt-[14px] pb-[10px] flex items-center justify-between">
        <div>
          <p className="font-gothic text-sub" style={{ fontSize: 11 }}>管理画面</p>
          <h1 className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 22 }}>オーナー管理</h1>
        </div>
        <button
          onClick={loadData}
          className="grid place-items-center bg-white active:scale-95 transition-transform"
          style={{ width: 40, height: 40, borderRadius: 13, border: "1px solid rgba(0,0,0,.07)" }}
        >
          <Icon name="refresh" size={18} color="#1A1714" strokeWidth={2.2} />
        </button>
      </div>

      {/* Tabs */}
      <div className="mx-[20px] mb-[14px] flex gap-[3px] p-[3px]" style={{ background: "#EBE2CF", borderRadius: 14 }}>
        {(["stats", "users", "rooms", "moderation"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 text-center font-gothic"
            style={{
              fontSize: 12, padding: "8px 0", borderRadius: 11,
              background: tab === t ? "#1A1714" : "transparent",
              color: tab === t ? "#FBF7EC" : "#7A6F5C",
              fontWeight: tab === t ? 700 : 600,
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-[20px] flex-1">
        {tab === "stats" && (
          <div className="flex flex-col gap-[12px]">
            <div className="flex gap-[10px]">
              <StatCard label="総ユーザー" value={users.length} />
              <StatCard label="総部屋数" value={rooms.length} />
            </div>
            <div className="flex gap-[10px]">
              <StatCard label="受付中" value={waitingRooms} color="#2BA35F" />
              <StatCard label="進行中" value={activeRooms} color="#E5402F" />
            </div>
            <div className="flex gap-[10px]">
              <StatCard label="総回答数" value={answers.length} color="#F4C422" />
              <StatCard label="終了部屋" value={rooms.length - activeRooms - waitingRooms} />
            </div>

            {/* Recent activity */}
            <p className="font-gothic font-extrabold text-[#1A1714] mt-2" style={{ fontSize: 14 }}>最近の部屋</p>
            <div className="flex flex-col gap-[8px]">
              {rooms.slice(0, 5).map((room) => {
                const st = STATUS_STYLE[room.status] ?? STATUS_STYLE.waiting;
                return (
                  <div
                    key={room.id}
                    className="bg-white flex items-center gap-[10px]"
                    style={{ borderRadius: 14, padding: "10px 14px", border: "1px solid rgba(0,0,0,.07)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-gothic font-bold text-[#1A1714] truncate" style={{ fontSize: 13 }}>{room.name}</p>
                      <p className="font-gothic text-sub" style={{ fontSize: 11 }}>
                        {room.memberIds.length}人 ・ {formatDate(room.createdAt)}
                      </p>
                    </div>
                    <span
                      className="font-gothic font-extrabold shrink-0"
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: st.bg, color: st.color }}
                    >
                      {STATUS_LABEL[room.status] ?? room.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="flex flex-col gap-[8px]">
            <p className="font-gothic text-sub mb-1" style={{ fontSize: 12 }}>{users.length}人のユーザー</p>
            {users.map((user) => {
              const icon = (user.avatarIcon as EngimonoName) || "fuku";
              return (
                <div
                  key={user.id}
                  className="bg-white flex items-center gap-[12px]"
                  style={{ borderRadius: 14, padding: "10px 14px", border: "1px solid rgba(0,0,0,.07)" }}
                >
                  <div
                    className="shrink-0 grid place-items-center overflow-hidden"
                    style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0EBE0" }}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Engimono name={icon} width={22} height={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-gothic font-bold text-[#1A1714] truncate" style={{ fontSize: 13 }}>
                      {user.nickname ?? "未設定"}
                    </p>
                    <p className="font-gothic text-sub" style={{ fontSize: 11 }}>
                      {userRoomCounts[user.id] ?? 0}部屋参加 ・ {formatDate(user.createdAt)}
                    </p>
                  </div>
                  <p className="font-gothic text-sub shrink-0" style={{ fontSize: 10 }}>
                    {user.id.slice(0, 8)}...
                  </p>
                </div>
              );
            })}
            {users.length === 0 && (
              <p className="font-gothic text-sub text-center py-8" style={{ fontSize: 13 }}>ユーザーはまだいません</p>
            )}
          </div>
        )}

        {tab === "rooms" && (
          <div className="flex flex-col gap-[8px]">
            <p className="font-gothic text-sub mb-1" style={{ fontSize: 12 }}>{rooms.length}部屋</p>
            {rooms.map((room) => {
              const st = STATUS_STYLE[room.status] ?? STATUS_STYLE.waiting;
              return (
                <div
                  key={room.id}
                  className="bg-white"
                  style={{ borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(0,0,0,.07)" }}
                >
                  <div className="flex items-center gap-[10px] mb-2">
                    <p className="font-gothic font-bold text-[#1A1714] truncate flex-1" style={{ fontSize: 13 }}>{room.name}</p>
                    <span
                      className="font-gothic font-extrabold shrink-0"
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, background: st.bg, color: st.color }}
                    >
                      {STATUS_LABEL[room.status] ?? room.status}
                    </span>
                  </div>
                  <p className="font-gothic text-sub mb-2" style={{ fontSize: 11 }}>
                    {room.memberIds.length}/{room.capacity ?? 5}人 ・ コード: {room.inviteCode} ・ {formatDate(room.createdAt)}
                  </p>
                  <p className="font-gothic text-sub mb-3" style={{ fontSize: 11 }}>
                    メンバー: {room.memberIds.map((uid) => getNickname(uid)).join(", ")}
                  </p>
                  <div className="flex gap-[6px]">
                    {room.status !== "waiting" && (
                      <button
                        onClick={() => changeRoomStatus(room.id, "waiting")}
                        className="font-gothic font-bold active:scale-95 transition-transform"
                        style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, background: "#EFE8DA", color: "#7A6F5C" }}
                      >
                        受付中に戻す
                      </button>
                    )}
                    {room.status !== "finished" && (
                      <button
                        onClick={() => changeRoomStatus(room.id, "finished")}
                        className="font-gothic font-bold active:scale-95 transition-transform"
                        style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, background: "#EFE8DA", color: "#7A6F5C" }}
                      >
                        終了にする
                      </button>
                    )}
                    <button
                      onClick={() => deleteRoom(room.id, room.name)}
                      className="font-gothic font-bold text-paper active:scale-95 transition-transform ml-auto"
                      style={{ fontSize: 11, padding: "5px 10px", borderRadius: 8, background: "#E5402F" }}
                    >
                      削除
                    </button>
                  </div>
                </div>
              );
            })}
            {rooms.length === 0 && (
              <p className="font-gothic text-sub text-center py-8" style={{ fontSize: 13 }}>部屋はまだありません</p>
            )}
          </div>
        )}

        {tab === "moderation" && (
          <div className="flex flex-col gap-[8px]">
            <p className="font-gothic text-sub mb-1" style={{ fontSize: 12 }}>{answers.length}件の回答</p>
            {answers.map((item) => (
              <div
                key={item.answerId}
                className="bg-white"
                style={{ borderRadius: 14, padding: "12px 14px", border: "1px solid rgba(0,0,0,.07)" }}
              >
                <p className="font-gothic text-sub truncate mb-1" style={{ fontSize: 11 }}>
                  お題: {item.questionText}
                </p>
                <p className="font-gothic font-bold text-[#1A1714] mb-1" style={{ fontSize: 13 }}>
                  {item.text}
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-gothic text-sub" style={{ fontSize: 11 }}>
                    {getNickname(item.userId)} ・ {formatDate(item.submittedAt)}
                  </p>
                  <button
                    onClick={() => deleteAnswer(item)}
                    className="font-gothic font-bold text-paper active:scale-95 transition-transform"
                    style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: "#E5402F" }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
            {answers.length === 0 && (
              <p className="font-gothic text-sub text-center py-8" style={{ fontSize: 13 }}>回答はまだありません</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
