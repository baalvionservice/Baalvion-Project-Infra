import { cookies } from 'next/headers';
import type { ClientOptions } from './client';

/**
 * Request options for a server component.
 *
 * One upstream: the auth-gateway, for every render, signed in or not.
 *
 * It used to be two. The gateway guarded all of `/api/*` with a session and answered 401 to
 * anonymous callers — correct for a product whose whole surface is private, wrong for one
 * with a public front — so anonymous reads were routed around it, straight to the service.
 * The gateway now carries an explicit allow-list of public CanWeMarry reads
 * (auth-gateway/middleware/anonymousAllowList.js), which removes the reason for the second
 * door and, with it, a standing invitation to widen it. The service is once again reachable
 * only through the gateway, which is what the system contract asks for.
 *
 * A server render has no ambient cookie jar, so the visitor's cookies are forwarded
 * explicitly — without that, a signed-in person would see the public view of their own case.
 * A visitor simply has none to forward, and the gateway lets the read through on its merits.
 * The BROWSER never reaches either the gateway or the service directly; this hop is
 * server-to-server inside the deployment.
 */
const GATEWAY_ORIGIN = process.env.GATEWAY_ORIGIN ?? 'http://localhost:3099';
const GATEWAY_BASE = process.env.CANWEMARRY_API_BASE ?? `${GATEWAY_ORIGIN}/api/canwemarry/v1`;

export async function serverOptions(): Promise<ClientOptions> {
  const jar = await cookies();
  const header = jar.getAll().map((c) => `${c.name}=${c.value}`).join('; ');
  return { baseUrl: GATEWAY_BASE, headers: header ? { Cookie: header } : {} };
}
