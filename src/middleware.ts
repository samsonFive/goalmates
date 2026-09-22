import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const publicPaths = ["/login", "/signup", "/manifest.webmanifest", "/sw.js", "/icons"];

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (isPublic || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }
  if (!request.auth) {
    const login = new URL("/login", request.nextUrl);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
