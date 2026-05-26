import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle old terms URL structure: /terms/[slug] -> /terms/[letter]/[slug]
  if (pathname.startsWith("/terms/") && pathname.split("/").length === 3) {
    const slug = pathname.split("/")[2];

    // Skip if it's already the new format (has letter segment)
    if (slug.length === 1 || slug === "num") {
      return NextResponse.next();
    }

    // Import terms data to find the correct letter
    // Since we can't import the terms data directly in middleware,
    // we'll use a simple heuristic based on the slug
    const firstChar = slug.charAt(0).toLowerCase();
    const letter = /^[0-9]/.test(firstChar) ? "num" : firstChar;

    const newUrl = new URL(`/terms/${letter}/${slug}`, request.url);
    return NextResponse.redirect(newUrl, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/terms/:path*",
};
