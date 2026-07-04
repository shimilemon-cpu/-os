import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebase/admin";

function getOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return url.origin.replace(/^http:/, "https:");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getOrigin(request);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/auth/login?error=line_denied`);
  }

  const cookieStore = await cookies();
  const stored = cookieStore.get("line_oauth_state")?.value;
  cookieStore.delete("line_oauth_state");

  if (!stored) {
    return NextResponse.redirect(`${origin}/auth/login?error=no_state`);
  }

  let next = "/rooms";
  try {
    const parsed = JSON.parse(stored);
    if (parsed.state !== state) {
      return NextResponse.redirect(`${origin}/auth/login?error=invalid_state`);
    }
    const rawNext: string = parsed.next ?? "/rooms";
    next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/rooms";
  } catch {
    return NextResponse.redirect(`${origin}/auth/login?error=invalid_state`);
  }

  if (!process.env.LINE_CHANNEL_ID || !process.env.LINE_CHANNEL_SECRET) {
    console.error("LINE_CHANNEL_ID or LINE_CHANNEL_SECRET not set");
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }

  try {
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${origin}/auth/callback`,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    });

    if (!tokenRes.ok) {
      console.error("LINE token error:", await tokenRes.text());
      return NextResponse.redirect(`${origin}/auth/login?error=token_failed`);
    }

    const { access_token } = await tokenRes.json();

    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!profileRes.ok) {
      console.error("LINE profile error:", await profileRes.text());
      return NextResponse.redirect(`${origin}/auth/login?error=profile_failed`);
    }

    const profile = await profileRes.json();
    const lineUserId: string = profile.userId;
    const displayName: string = profile.displayName ?? "LINEユーザー";
    const pictureUrl: string | null = profile.pictureUrl ?? null;

    const firebaseUid = `line_${lineUserId}`;

    const userRef = adminDb.doc(`users/${firebaseUid}`);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      await userRef.set({
        nickname: displayName,
        avatarUrl: pictureUrl,
        avatarIcon: null,
        lineUserId,
        createdAt: new Date(),
      });
    } else {
      await userRef.update({
        avatarUrl: userSnap.data()?.avatarUrl ?? pictureUrl,
      });
    }

    const customToken = await getAuth().createCustomToken(firebaseUid);

    const redirectUrl = new URL("/auth/complete", origin);
    redirectUrl.searchParams.set("next", next);
    redirectUrl.searchParams.set("name", displayName);
    if (pictureUrl) redirectUrl.searchParams.set("picture", pictureUrl);

    const res = NextResponse.redirect(redirectUrl.toString());
    res.cookies.set("firebase_custom_token", customToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("LINE auth error:", e instanceof Error ? e.stack : e);
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
  }
}
