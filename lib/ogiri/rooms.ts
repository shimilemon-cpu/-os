import {
  collection, doc, addDoc, getDoc, updateDoc,
  onSnapshot, Timestamp, arrayUnion, setDoc,
  query, where, orderBy, limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { RoomDoc, RoomMemberDoc, InviteCodeDoc } from "@/lib/types";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function createRoom(
  hostId: string,
  hostNickname: string,
  name: string,
  mode: "realtime" | "async" = "realtime"
): Promise<string> {
  const inviteCode = generateInviteCode();

  const roomRef = await addDoc(collection(db, "rooms"), {
    name,
    hostId,
    inviteCode,
    mode,
    status: "waiting",
    memberIds: [hostId],
    createdAt: Timestamp.now(),
  });

  await setDoc(doc(db, "inviteCodes", inviteCode), {
    roomId: roomRef.id,
    createdAt: Timestamp.now(),
  } satisfies Omit<InviteCodeDoc, "id">);

  await setDoc(doc(db, "rooms", roomRef.id, "members", hostId), {
    userId: hostId,
    nickname: hostNickname,
    isReady: false,
    joinedAt: Timestamp.now(),
  } satisfies Omit<RoomMemberDoc, "id">);

  return roomRef.id;
}

export async function joinRoomByCode(
  inviteCode: string,
  userId: string,
  nickname: string
): Promise<string> {
  const codeSnap = await getDoc(doc(db, "inviteCodes", inviteCode.toUpperCase()));
  if (!codeSnap.exists()) throw new Error("招待コードが無効です");

  const { roomId } = codeSnap.data() as InviteCodeDoc;
  const roomSnap = await getDoc(doc(db, "rooms", roomId));
  if (!roomSnap.exists()) throw new Error("ルームが見つかりません");

  const room = roomSnap.data() as RoomDoc;
  if (room.memberIds.includes(userId)) return roomId;
  if (room.memberIds.length >= 5) throw new Error("定員オーバー（最大5人）");
  if (room.status !== "waiting") throw new Error("ゲームはすでに開始されています");

  await updateDoc(doc(db, "rooms", roomId), { memberIds: arrayUnion(userId) });
  await setDoc(doc(db, "rooms", roomId, "members", userId), {
    userId,
    nickname,
    isReady: false,
    joinedAt: Timestamp.now(),
  } satisfies Omit<RoomMemberDoc, "id">);

  return roomId;
}

export async function getRoom(roomId: string): Promise<RoomDoc | null> {
  const snap = await getDoc(doc(db, "rooms", roomId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RoomDoc;
}

export function subscribeRoom(roomId: string, cb: (room: RoomDoc) => void) {
  return onSnapshot(doc(db, "rooms", roomId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as RoomDoc);
  });
}

export function subscribeMembers(roomId: string, cb: (members: RoomMemberDoc[]) => void) {
  return onSnapshot(collection(db, "rooms", roomId, "members"), (snap) => {
    cb(snap.docs.map((d) => ({ ...d.data() } as RoomMemberDoc)));
  });
}

export async function setMemberReady(roomId: string, userId: string, isReady: boolean) {
  await updateDoc(doc(db, "rooms", roomId, "members", userId), { isReady });
}

export function subscribeUserRooms(userId: string, cb: (rooms: RoomDoc[]) => void) {
  const q = query(
    collection(db, "rooms"),
    where("memberIds", "array-contains", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomDoc)));
  });
}

export async function startGame(roomId: string) {
  await updateDoc(doc(db, "rooms", roomId), { status: "active" });
}

export async function finishGame(roomId: string) {
  await updateDoc(doc(db, "rooms", roomId), { status: "finished" });
}
