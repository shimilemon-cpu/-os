import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
