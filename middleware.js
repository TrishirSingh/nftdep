import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

  // Pages that require authentication
  const protectedPages = ["/create", "/mynfts", "/myprofile", "/edit-profile"];
  
  // Pages that don't require auth
  const publicPages = ["/", "/explore", "/search", "/auth/signin"];

  // If accessing a protected page without auth, redirect to sign in
  if (protectedPages.some((page) => pathname.startsWith(page))) {
    if (!token) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // If already signed in and trying to access sign in page, redirect to home
  if (pathname === "/auth/signin" && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

    return NextResponse.next();
  } catch (error) {
    // If middleware fails, allow request to continue
    console.error("Middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

