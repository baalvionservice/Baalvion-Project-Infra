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
 * The founder side is deliberately NOT gated: /invest/list-your-business and /onboarding/business
 * are where a company applies to raise. That is not Baalvion soliciting investment in itself, and
 * it is the intake the Insiders directory sends unauthenticated traffic to.
 */

/** Investor-side prefixes. Anything matching needs an invitation. */
const GATED = ['/invest', '/onboarding'] as const;

/** Founder-side routes that sit under a gated prefix but must stay open. */
const OPEN_EXCEPTIONS = ['/invest/list-your-business', '/onboarding/business'] as const;

export const INVITE_COOKIE = 'bv_ir_invite';

/** Where an uninvited visitor is sent. Public, indexable, and makes no offer. */
export const REQUEST_ACCESS_PATH = '/invest/request-access';

export function isInviteGated(pathname: string): boolean {
  if (pathname === REQUEST_ACCESS_PATH) return false;
  if (OPEN_EXCEPTIONS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
  return GATED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Length-independent comparison so a wrong code cannot be narrowed down by response timing.
 * Cheap enough to be worth doing even though an invite code is not a password.
 */
export function codeMatches(supplied: string | undefined, expected: string): boolean {
  if (!supplied || !expected) return false;
  if (supplied.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < supplied.length; i += 1) diff |= supplied.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * The configured invitation code, or null when none is set.
 *
 * Fails CLOSED in production: with no code configured every invitation fails and the funnel stays
 * shut. An unset environment variable must not silently reopen public solicitation — that is the
 * failure mode this whole module exists to prevent. Development is left open so the funnel is
 * still workable locally.
 */
export function configuredInviteCode(env: NodeJS.ProcessEnv): string | null {
  const code = env.IR_INVEST_ACCESS_CODE?.trim();
  return code && code.length > 0 ? code : null;
}
