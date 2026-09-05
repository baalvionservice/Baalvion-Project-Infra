/**
 * @file server/gckb/optional-identity.ts
 * @description Resolve the caller's organization when they present a signed identity,
 * and nobody at all when they do not.
 *
 * The port directory and the corridor planner are public surfaces, but a signed-in
 * caller should see their own registry corrections layered over the global baseline.
 * Identity is therefore optional here: present and valid promotes the read to the
 * tenant's scope, absent or invalid falls back to the public baseline rather than
 * failing the request.
 */
import { verifyIdentity } from '../http/identity';

export function optionalOrganizationId(req: Request): string | null {
  try {
    return verifyIdentity(req).organizationId ?? null;
  } catch {
    return null;
  }
}
