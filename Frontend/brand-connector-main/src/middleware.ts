import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Baalvion Route Protection Middleware - DISABLED for unrestricted access
 */
export function middleware(request: NextRequest) {
  // Authorization checks removed to allow instant access to all routes
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public|logo.png).*)",
  ],
};
