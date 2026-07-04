import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/rooms";

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set("line_oauth_state", JSON.stringify({ state, next }), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINE_CHANNEL_ID!,
    redirect_uri: `${origin}/auth/callback`,
    state,
    scope: "profile openid",
  });

  return NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`
  );
}
