import {
  collection, doc, getDoc, updateDoc,
  onSnapshot, Timestamp, arrayUnion, setDoc,
  query, where, orderBy, limit,
  DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { RoomDoc, RoomMemberDoc, InviteCodeDoc, TopicMode } from "@/lib/types";

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function generateRoomRef(): DocumentReference {
  return doc(collection(db, "rooms"));
}

export async function createRoom(
  hostId: string,
  hostNickname: string,
  name: string,
  mode: "realtime" | "async" = "realtime",
  judges: ("王道" | "辛口")[] = ["王道", "辛口"],
  roomRef?: DocumentReference,
  inviteCode?: string,
  topicMode: TopicMode = "omakase",
): Promise<string> {
  const code = inviteCode ?? generateInviteCode();
  const ref = roomRef ?? generateRoomRef();

  await setDoc(ref, {
    name,
    hostId,
    inviteCode: code,
    mode,
    topicMode,
    status: "waiting",
    memberIds: [hostId],
    judges,
    createdAt: Timestamp.now(),
  });

  await Promise.all([
    setDoc(doc(db, "inviteCodes", code), {
      roomId: ref.id,
      createdAt: Timestamp.now(),
    } satisfies Omit<InviteCodeDoc, "id">),
    setDoc(doc(db, "rooms", ref.id, "members", hostId), {
      userId: hostId,
      nickname: hostNickname,
      isReady: false,
      joinedAt: Timestamp.now(),
    } satisfies Omit<RoomMemberDoc, "id">),
  ]);

  return ref.id;
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
  return onSnapshot(
    doc(db, "rooms", roomId),
    (snap) => { if (snap.exists()) cb({ id: snap.id, ...snap.data() } as RoomDoc); },
    (err) => console.error("subscribeRoom:", err),
  );
}

export function subscribeMembers(roomId: string, cb: (members: RoomMemberDoc[]) => void) {
  return onSnapshot(collection(db, "rooms", roomId, "members"), (snap) => {
    cb(snap.docs.map((d) => ({ ...d.data() } as RoomMemberDoc)));
  });
}

export async function setMemberReady(roomId: string, userId: string, isReady: boolean) {
  await updateDoc(doc(db, "rooms", roomId, "members", userId), { isReady });
}

export function subscribeUserRooms(
  userId: string,
  cb: (rooms: RoomDoc[]) => void,
  onError?: (e: Error) => void,
) {
  const q = query(
    collection(db, "rooms"),
    where("memberIds", "array-contains", userId),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomDoc))),
    (err) => { console.error("subscribeUserRooms:", err); onError?.(err); },
  );
}

export async function startGame(roomId: string) {
  await updateDoc(doc(db, "rooms", roomId), { status: "active" });
}

export async function finishGame(roomId: string) {
  await updateDoc(doc(db, "rooms", roomId), { status: "finished" });
}
