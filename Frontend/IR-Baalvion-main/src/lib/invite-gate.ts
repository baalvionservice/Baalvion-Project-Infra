/**
 * The invitation gate on the investor side of the funnel.
 *
 * TODO(legal): this gate exists for a statutory reason, not a product one. Under the Companies
 * Act, 2013 s.42, a private limited company may not advertise or solicit investment from the
 * general public — a private placement goes to identified persons only, capped at 200 per
 * financial year (excluding QIBs and ESOP holders), via Form PAS-4. An openly crawlable /invest
 * listing and a /onboarding funnel anyone can complete is exactly the public solicitation that
 * section prohibits. Do not remove this gate, widen it, or make it fail open, without a company
 * secretary signing off on the placement route first.
 *
 * Each invitation is issued to ONE named person. That is the point: "identified persons" is the
 * statutory test, and a single shared code identifies nobody — it gets forwarded, it cannot be
 * revoked for one recipient without locking out everyone, and it leaves no record of who was
 * actually invited. Per-person codes give you a revocable list of exactly who holds access.
 *
 * Codes are stored as SHA-256 hashes, never in the clear. Configuration is read by anyone with
 * deploy access and ends up in logs and screenshots; a hash there cannot be used to walk in.
 * Generate entries with `pnpm invite:new "Name" <email>` (scripts/new-invite.mjs).
 *
 * The founder side is deliberately NOT gated: /invest/list-your-business and /onboarding/business
 * are where a company applies to raise. That is not Baalvion soliciting investment in itself, and
 * it is the intake the Insiders directory sends unauthenticated traffic to.
 */

/** Investor-side prefixes. Anything matching needs an invitation. */
const GATED = ['/invest', '/onboarding'] as const;

/** Founder-side routes that sit under a gated prefix but must stay open. */
const OPEN_EXCEPTIONS = ['/invest/list-your-business', '/onboarding/business'] as const;

/** Carries the invitation id — never the code itself. */
export const INVITE_COOKIE = 'bv_ir_invite';

/** Where an uninvited visitor is sent. Public, indexable, and makes no offer. */
export const REQUEST_ACCESS_PATH = '/invest/request-access';

/**
 * s.42 caps a private placement at 200 identified persons per financial year, excluding QIBs and
 * ESOP holders. This is a tripwire, not a compliance control — the statutory count is of persons
 * the offer is *made* to, which is a company-secretary judgement, not something a web gate can
 * decide. It exists so the list cannot quietly grow past the cap unnoticed.
 */
export const PLACEMENT_CAP = 200;

export interface Invite {
  /** Stable id for one named recipient. Written to the cookie and the access log. */
  readonly id: string;
  /** Who this was issued to. Not shown to the visitor; it is here so the list is auditable. */
  readonly label: string;
  /** Lowercase hex SHA-256 of the invitation code. */
  readonly sha256: string;
  /** ISO date (YYYY-MM-DD) after which the invitation stops working. Null = no expiry. */
  readonly expires: string | null;
}

/**
 * The configured invitations.
 *
 * Fails CLOSED: an unparseable or absent list yields no invitations, so every visitor is turned
 * away rather than let in. An environment variable that failed to load must never silently
 * reopen public solicitation — that is the exact failure this module exists to prevent.
 */
export function configuredInvites(env: Record<string, string | undefined>): Invite[] {
  const raw = env.IR_INVEST_INVITES?.trim();
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const invites: Invite[] = [];
  const seen = new Set<string>();
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue;
    const o = entry as Record<string, unknown>;
    const id = typeof o.id === 'string' ? o.id.trim() : '';
    const sha256 = typeof o.sha256 === 'string' ? o.sha256.trim().toLowerCase() : '';
    // A malformed digest can never match anything, so an entry with one is not a usable
    // invitation — drop it rather than carry a row that looks issued but can never be redeemed.
    if (!id || !/^[0-9a-f]{64}$/.test(sha256)) continue;
    // Two invitations sharing an id would make the access log ambiguous about who came in.
    if (seen.has(id)) continue;
    seen.add(id);
    invites.push({
      id,
      label: typeof o.label === 'string' && o.label.trim() ? o.label.trim() : id,
      sha256,
      expires: typeof o.expires === 'string' && o.expires.trim() ? o.expires.trim() : null,
    });
  }
  return invites;
}

/** SHA-256, hex. Uses WebCrypto, which the Edge runtime provides. */
export async function hashCode(code: string): Promise<string> {
  const bytes = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Length-independent comparison so a near-miss cannot be narrowed down by response timing. */
export function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isExpired(invite: Invite, now: Date): boolean {
  if (!invite.expires) return false;
  // Compared as dates, so an invitation lasts through the whole of its final day.
  const cutoff = new Date(`${invite.expires}T23:59:59.999Z`);
  return Number.isFinite(cutoff.getTime()) && now.getTime() > cutoff.getTime();
}

/**
 * Resolve a supplied code to the invitation that issued it, or null.
 * Every candidate is compared even after a match so the work does not depend on list position.
 */
export async function resolveCode(
  code: string | undefined | null,
  invites: readonly Invite[],
  now: Date = new Date(),
): Promise<Invite | null> {
  if (!code || invites.length === 0) return null;
  const supplied = await hashCode(code);
  let found: Invite | null = null;
  for (const invite of invites) {
    if (constantTimeEquals(supplied, invite.sha256) && !isExpired(invite, now)) found = invite;
  }
  return found;
}

/** Whether a cookie value names a still-valid invitation. */
export function resolveInviteId(
  id: string | undefined | null,
  invites: readonly Invite[],
  now: Date = new Date(),
): Invite | null {
  if (!id) return null;
  const invite = invites.find((i) => i.id === id);
  return invite && !isExpired(invite, now) ? invite : null;
}

export function isInviteGated(pathname: string): boolean {
  if (pathname === REQUEST_ACCESS_PATH) return false;
  if (OPEN_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return GATED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
