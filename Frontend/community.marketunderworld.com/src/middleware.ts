import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /auth routes except maybe reset-password
  if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/registration')) {
    const hasUnlocked = request.cookies.has('underground_unlocked');
    
    if (!hasUnlocked) {
      // Redirect to home page with terminal-auth hash
      return NextResponse.redirect(new URL('/#terminal-auth', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/:path*'],
};
