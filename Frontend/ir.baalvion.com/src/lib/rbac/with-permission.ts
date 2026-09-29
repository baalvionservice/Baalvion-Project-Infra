import { NextResponse } from 'next/server';
import { checkPermission } from './checkPermission';
import { AppPermission } from './permissionRegistry';
import type { AppRole } from './roles';

/**
 * API Permission Wrapper for IR's internal Next API routes.
 *
 * SECURITY (P0 remediation): the role is now derived from the Bearer ACCESS TOKEN that the client
 * sends from in-memory state (set only by a real login), NOT from the forgeable `baalvion_session_mock`
 * cookie (removed). The access token is decoded for its role claim. NOTE: these internal routes do not
 * hold the RS256 public key, so this is an unverified decode — decisive verification happens upstream
 * at auth-service; this guard is defense-in-depth for IR's simulation API surface.
 */
function roleFromBearer(req: Request): AppRole {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return 'public';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString('utf8'));
    return (payload?.role as AppRole) || 'public';
  } catch {
    return 'public';
  }
}

export function withPermission(
  permission: AppPermission,
  handler: (req: Request, session: { role: AppRole }) => Promise<Response> | Response,
) {
  return async (req: Request) => {
    const role = roleFromBearer(req);

    if (!checkPermission(role, permission)) {
      return NextResponse.json(
        { success: false, error: 'FORBIDDEN', message: 'Insufficient privileges' },
        { status: 403 },
      );
    }

    return handler(req, { role });
  };
}
