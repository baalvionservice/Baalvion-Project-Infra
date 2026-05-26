import { NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth/session';
import { checkPermission } from './checkPermission';
import { AppPermission } from './permissionRegistry';

/**
 * API Permission Wrapper (Real Enforcement for Mock Backend)
 */
export function withPermission(
  permission: AppPermission,
  handler: (req: Request, session: any) => Promise<Response> | Response
) {
  return async (req: Request) => {
    // In Next.js API routes, cookies are accessed differently
    // This is a simplified version for simulation
    const cookieHeader = req.headers.get('cookie') || '';
    const sessionCookie = cookieHeader
      .split('; ')
      .find(row => row.startsWith('baalvion_session_mock='))
      ?.split('=')[1];

    const session = getSessionFromCookie(sessionCookie);

    if (!checkPermission(session.role, permission)) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Insufficient privileges' },
        { status: 403 }
      );
    }

    return handler(req, session);
  };
}
