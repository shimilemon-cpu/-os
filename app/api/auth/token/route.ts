import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("firebase_custom_token")?.value ?? null;
  cookieStore.delete("firebase_custom_token");
  return NextResponse.json({ token });
}
