"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, limit, doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase/client";
import type { RoomDoc } from "@/lib/types";

interface PhotoItem {
  roomId: string;
  roomName: string;
  sessionId: string;
  roundId: string;
  imageUrl: string;
  text: string;
}

const ADMIN_UIDS = process.env.NEXT_PUBLIC_ADMIN_UID?.split(",") ?? [];

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<(RoomDoc & { id: string })[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tab, setTab] = useState<"photos" | "rooms">("photos");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { router.push("/auth/login"); return; }
    if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(user.uid)) {
      router.push("/rooms");
      return;
    }
    setAuthorized(true);
    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const roomsSnap = await getDocs(query(collection(db, "rooms"), orderBy("createdAt", "desc"), limit(50)));
      const roomsList = roomsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomDoc & { id: string }));
      setRooms(roomsList);

      const photoItems: PhotoItem[] = [];
      for (const room of roomsList.slice(0, 20)) {
        const sessionsSnap = await getDocs(query(collection(db, "sessions"), limit(5)));
        for (const sess of sessionsSnap.docs) {
          const roundsSnap = await getDocs(collection(db, "sessions", sess.id, "rounds"));
          for (const rd of roundsSnap.docs) {
            const data = rd.data();
            if (data.question?.imageUrl) {
              photoItems.push({
                roomId: room.id,
                roomName: room.name,
                sessionId: sess.id,
                roundId: rd.id,
                imageUrl: data.question.imageUrl,
                text: data.question.text ?? "",
              });
            }
          }
        }
      }
      setPhotos(photoItems);
    } finally {
      setLoading(false);
    }
  };

  const deletePhoto = async (photo: PhotoItem) => {
    if (!confirm("この写真を削除しますか？削除すると元に戻せません。")) return;
    setDeleting(photo.imageUrl);
    try {
      try {
        const storageRef = ref(storage, photo.imageUrl);
        await deleteObject(storageRef);
      } catch {
        const url = new URL(photo.imageUrl);
        const path = decodeURIComponent(url.pathname.split("/o/")[1]?.split("?")[0] ?? "");
        if (path) {
          const storageRef = ref(storage, path);
          await deleteObject(storageRef);
        }
      }
      const roundRef = doc(db, "sessions", photo.sessionId, "rounds", photo.roundId);
      await deleteDoc(roundRef);
      setPhotos((prev) => prev.filter((p) => p.imageUrl !== photo.imageUrl));
    } catch (e) {
      console.error("Delete failed:", e);
      alert("削除に失敗しました");
    } finally {
      setDeleting(null);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="w-8 h-8 rounded-full border-2 border-red border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper pb-[100px]">
      <div className="px-[20px] pt-[14px] pb-[10px]">
        <p className="font-gothic text-sub" style={{ fontSize: 11 }}>管理画面</p>
        <h1 className="font-mincho font-extrabold text-[#1A1714]" style={{ fontSize: 22 }}>オーナー管理</h1>
      </div>

      <div className="mx-[20px] mb-[14px] flex gap-[4px] p-[4px]" style={{ background: "#EBE2CF", borderRadius: 14 }}>
        {(["photos", "rooms"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 text-center font-gothic"
            style={{
              fontSize: 13, padding: "8px 0", borderRadius: 11,
              background: tab === t ? "#1A1714" : "transparent",
              color: tab === t ? "#FBF7EC" : "#7A6F5C",
              fontWeight: tab === t ? 700 : 600,
            }}
          >
            {t === "photos" ? "投稿写真" : "部屋一覧"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-red border-t-transparent animate-spin" />
        </div>
      ) : tab === "photos" ? (
        <div className="px-[20px] flex flex-col gap-[10px]">
          {photos.length === 0 ? (
            <p className="font-gothic text-sub text-center py-8" style={{ fontSize: 13 }}>投稿写真はまだありません</p>
          ) : (
            photos.map((photo) => (
              <div
                key={photo.imageUrl}
                className="bg-white flex gap-[12px] items-start"
                style={{ borderRadius: 16, padding: 12, border: "1px solid rgba(0,0,0,.07)" }}
              >
                <div style={{ width: 80, height: 60, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.imageUrl} alt="" className="w-full h-full" style={{ objectFit: "cover" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-gothic font-bold text-[#1A1714] truncate" style={{ fontSize: 13 }}>{photo.text}</p>
                  <p className="font-gothic text-sub" style={{ fontSize: 11 }}>{photo.roomName}</p>
                </div>
                <button
                  onClick={() => deletePhoto(photo)}
                  disabled={deleting === photo.imageUrl}
                  className="font-gothic font-bold text-paper shrink-0 active:scale-95 transition-transform disabled:opacity-40"
                  style={{ fontSize: 11, padding: "6px 10px", borderRadius: 8, background: "#E5402F" }}
                >
                  {deleting === photo.imageUrl ? "…" : "削除"}
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="px-[20px] flex flex-col gap-[8px]">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white flex items-center gap-[12px]"
              style={{ borderRadius: 14, padding: "10px 14px", border: "1px solid rgba(0,0,0,.07)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-gothic font-bold text-[#1A1714] truncate" style={{ fontSize: 13 }}>{room.name}</p>
                <p className="font-gothic text-sub" style={{ fontSize: 11 }}>
                  {room.memberIds.length}人 ・ {room.status} ・ {room.inviteCode}
                </p>
              </div>
              <span
                className="font-gothic font-extrabold shrink-0"
                style={{
                  fontSize: 10, padding: "2px 7px", borderRadius: 999,
                  background: room.status === "active" ? "#E6F5EC" : "#EFE8DA",
                  color: room.status === "active" ? "#2BA35F" : "#7A6F5C",
                }}
              >
                {room.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
