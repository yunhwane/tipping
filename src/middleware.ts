import { auth } from "~/server/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith("/admin")) {
    // Not logged in → redirect to signin
    if (!req.auth) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Not ADMIN → redirect to home
    if (req.auth.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
