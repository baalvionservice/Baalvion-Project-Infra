import { NextRequest, NextResponse } from 'next/server';

// Hands the httpOnly access_token cookie to client JS as a short-lived (~15min, same TTL
// as the cookie itself) Socket.IO auth token. This doesn't introduce new exposure: the
// same cookie value already gets read server-side and forwarded as Bearer by
// community-proxy/giftcard-proxy on every request — this route just does that same
// translation for the one case (a browser-native WebSocket handshake) that can't flow
// through a same-origin fetch proxy. Never logged, never persisted client-side beyond the
// socket.io client's in-memory `auth` option.
export async function GET(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not signed in' } }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: { token } });
}
