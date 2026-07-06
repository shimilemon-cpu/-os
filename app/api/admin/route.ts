import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase/admin";

const ADMIN_UIDS = ["line_U5926c00204e9a7aaa2fb14902ea6a6c2"];

async function verifyAdmin(request: Request): Promise<string | null> {
  const idToken = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return null;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return ADMIN_UIDS.includes(decoded.uid) ? decoded.uid : null;
  } catch {
    return null;
  }
}

async function deleteCollection(path: string) {
  const snap = await adminDb.collection(path).listDocuments();
  if (snap.length === 0) return;
  const batch = adminDb.batch();
  for (const doc of snap) batch.delete(doc);
  await batch.commit();
}

async function deleteRoomFull(roomId: string) {
  await deleteCollection(`rooms/${roomId}/members`);

  const sessions = await adminDb
    .collection("sessions")
    .where("roomId", "==", roomId)
    .get();

  for (const sess of sessions.docs) {
    const rounds = await adminDb
      .collection(`sessions/${sess.id}/rounds`)
      .listDocuments();
    for (const round of rounds) {
      await deleteCollection(`sessions/${sess.id}/rounds/${round.id}/answers`);
      await deleteCollection(`sessions/${sess.id}/rounds/${round.id}/votes`);
      await deleteCollection(`sessions/${sess.id}/rounds/${round.id}/aiReviews`);
      await round.delete();
    }
    await sess.ref.delete();
  }

  await adminDb.doc(`rooms/${roomId}`).delete();
}

export async function POST(request: Request) {
  const adminUid = await verifyAdmin(request);
  if (!adminUid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { action, roomId, userId, reason, sessionId, roundId, answerId } = await request.json();

  switch (action) {
    case "deleteRoom": {
      if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });
      await deleteRoomFull(roomId);
      return NextResponse.json({ ok: true });
    }

    case "deleteAllRooms": {
      const rooms = await adminDb.collection("rooms").get();
      for (const room of rooms.docs) {
        await deleteRoomFull(room.id);
      }
      return NextResponse.json({ ok: true, deleted: rooms.size });
    }

    case "deleteUser": {
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
      const rooms = await adminDb
        .collection("rooms")
        .where("memberIds", "array-contains", userId)
        .get();
      const batch = adminDb.batch();
      for (const room of rooms.docs) {
        batch.delete(adminDb.doc(`rooms/${room.id}/members/${userId}`));
        const memberIds: string[] = room.data().memberIds ?? [];
        batch.update(room.ref, { memberIds: memberIds.filter((id) => id !== userId) });
      }
      await batch.commit();
      await adminDb.doc(`users/${userId}`).delete().catch(() => {});
      try {
        await getAuth().deleteUser(userId);
      } catch {
        // custom token user may not exist in Firebase Auth
      }
      return NextResponse.json({ ok: true });
    }

    case "banUser": {
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
      await adminDb.doc(`bannedUsers/${userId}`).set({
        reason: reason ?? "",
        bannedAt: new Date(),
        bannedBy: adminUid,
      });
      return NextResponse.json({ ok: true });
    }

    case "unbanUser": {
      if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
      await adminDb.doc(`bannedUsers/${userId}`).delete();
      return NextResponse.json({ ok: true });
    }

    case "deleteAnswer": {
      if (!sessionId || !roundId || !answerId)
        return NextResponse.json({ error: "sessionId, roundId, answerId required" }, { status: 400 });
      await adminDb.doc(`sessions/${sessionId}/rounds/${roundId}/answers/${answerId}`).delete();
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
