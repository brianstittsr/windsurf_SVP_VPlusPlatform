import { NextRequest, NextResponse } from "next/server";

const COGNIVERAI_HOSTS = new Set(["cogniverai.com", "www.cogniverai.com"]);

/**
 * Dormant host rewrite (Next.js proxy convention): when cogniverai.com DNS is pointed at this project,
 * requests are served from the /cogniverai surface. Inactive until the domain
 * is configured in Vercel.
 */
export function proxy(request: NextRequest): NextResponse {
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (!COGNIVERAI_HOSTS.has(host)) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/cogniverai") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = `/cogniverai${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
