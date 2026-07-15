import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/admin",
  "/network",
  "/stageverse",
  "/events/my-tickets",
  "/events/create",
  "/events/organizer",
];

// Routes only accessible when NOT logged in
const AUTH_ONLY_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("e5_auth_token")?.value;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthOnly = AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/network/:path*",
    "/stageverse/:path*",
    "/events/my-tickets",
    "/events/create",
    "/events/organizer/:path*",
    "/login",
    "/register",
  ],
};
