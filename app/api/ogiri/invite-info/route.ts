import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.json(null, { status: 400 });

  let decoded: string;
  try {
    decoded = decodeURIComponent(code);
  } catch {
    decoded = code;
  }

  const codeSnap = await adminDb.collection("inviteCodes").doc(decoded).get();
  if (codeSnap.exists) {
    return NextResponse.json(codeSnap.data());
  }

  const roomsSnap = await adminDb
    .collection("rooms")
    .where("inviteCode", "==", decoded)
    .limit(1)
    .get();
  if (!roomsSnap.empty) {
    const roomDoc = roomsSnap.docs[0];
    const room = roomDoc.data();
    return NextResponse.json({
      roomId: roomDoc.id,
      roomName: room.name ?? null,
      hostNickname: null,
    });
  }

  return NextResponse.json(null);
}
