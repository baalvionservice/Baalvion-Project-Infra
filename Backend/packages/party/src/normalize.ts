/**
 * Identity normalisation.
 *
 * Every matching decision downstream depends on these functions being conservative. The
 * temptation is to normalise aggressively — strip dots from Gmail local parts, ignore plus
 * addressing, collapse similar names — because it merges more records. But a wrong merge is
 * far worse than a missed one: it joins two people's payment history, their entitlements and
 * their support tickets, and it is very hard to unpick afterwards. So normalisation here does
 * only what is unambiguously safe.
 */

export class PartyError extends Error {
  public readonly code: string;
  public readonly detail: Record<string, unknown>;
  constructor(code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'PartyError';
    this.code = code;
    this.detail = detail;
  }
}

// Deliberately permissive on the local part and strict on the shape: this is a normaliser, not
// a deliverability check.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

/**
 * Lowercase and trim. Nothing else.
 *
 * Not done, on purpose:
 *   - stripping dots (`a.b@gmail.com`): a Gmail-only rule. Applied everywhere it merges
 *     genuinely different mailboxes at providers that treat dots as significant.
 *   - stripping plus-addressing (`a+shop@x.com`): the same tag is how many people keep
 *     separate accounts deliberately, and merging them is the user-visible bug.
 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  if (trimmed === '' || !EMAIL_RE.test(trimmed)) return null;
  return trimmed;
}

/**
 * Reduce a phone number to E.164 digits.
 *
 * A number without a country code cannot be matched safely across an estate that sells in five
 * markets — `9876543210` is a different person in India and the US — so a national-format number
 * returns null unless a default calling code is supplied explicitly by the caller that knows the
 * market.
 */
export function normalizePhone(phone: string | null | undefined, defaultCallingCode?: string): string | null {
  if (typeof phone !== 'string') return null;
  const raw = phone.trim();
  if (raw === '') return null;

  const hasPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return null; // E.164 bounds

  if (hasPlus) return `+${digits}`;

  if (defaultCallingCode) {
    const cc = String(defaultCallingCode).replace(/\D/g, '');
    if (!cc) return null;
    // A number already carrying its country code must not have it prepended twice.
    if (digits.startsWith(cc) && digits.length > cc.length + 6) return `+${digits}`;
    const combined = `${cc}${digits}`;
    return combined.length <= 15 ? `+${combined}` : null;
  }
  return null;
}

/** Trimmed, collapsed whitespace. Names are never a match key — only a display and review aid. */
export function normalizeName(name: string | null | undefined): string | null {
  if (typeof name !== 'string') return null;
  const cleaned = name.trim().replace(/\s+/g, ' ');
  return cleaned === '' ? null : cleaned;
}
