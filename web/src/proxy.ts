import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const hasToken = request.cookies.has(COOKIE_NAME);
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    if (hasToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!hasToken) {
    const url = new URL("/login", request.url);
    url.searchParams.set("retour", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Pages protégées (hors API, statiques et login)
    "/",
    "/equipements/:path*",
    "/utilisateurs/:path*",
    "/serveurs/:path*",
    "/sauvegardes/:path*",
    "/journal/:path*",
    "/login",
  ],
};