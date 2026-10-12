import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /auth routes except maybe reset-password
  if (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/registration')) {
    const hasUnlocked = request.cookies.has('underground_unlocked');
    
    if (!hasUnlocked) {
      // The access code step is a normal page that works on every screen, then it sends the visitor on to where they were going.
      const url = new URL('/access-code', request.url);
      url.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/:path*'],
};
