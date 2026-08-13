import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { detectLocale, isLocale, localeCookie, localeHeader } from "./lib/i18n/locales";

export function middleware(request: NextRequest) {
  const fromCookie = request.cookies.get(localeCookie)?.value;
  const locale = isLocale(fromCookie) ? fromCookie : detectLocale(request.headers.get("accept-language"));
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(localeHeader, locale);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!isLocale(fromCookie)) {
    response.cookies.set(localeCookie, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|fonts/|favicon|hero-whale).*)"],
};
