import { NextResponse, type NextRequest } from "next/server";

/** Cheap cookie presence check; real auth happens in layouts/handlers. */
export function proxy(req: NextRequest) {
  const has = req.cookies.getAll().some((c) => c.name.includes("better-auth.session_token"));
  const { pathname, search } = req.nextUrl;
  if (!has && (pathname.startsWith("/app") || pathname.startsWith("/partner") || pathname.startsWith("/admin"))) {
    const url = req.nextUrl.clone(); url.pathname = "/auth/login"; url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/app/:path*", "/partner/:path*", "/admin/:path*"] };
