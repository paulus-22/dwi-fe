import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap gate in front of /admin: no session cookie, no page. The API still
 * checks the token on every call — this only saves a round trip and avoids a
 * flash of an empty dashboard.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has("dwi_session")) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*"],
};
