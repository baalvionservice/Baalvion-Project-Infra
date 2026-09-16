/**
 * Party resolution — deciding whether two per-site customers are the same human.
 *
 * The governing rule: **auto-merge only when unambiguous, and only on verified signals.**
 *
 * An unverified email is a string someone typed. Anyone can type anyone else's. Merging on one
 * would let a person claim another's payment history, entitlements and support record simply by
 * entering their address at checkout — so unverified signals never merge, they only ever create
 * or attach with low confidence and a review flag.
 *
 * Where two verified signals disagree — the email says party A and the phone says party B — the
 * honest answer is "I don't know", not a guess. That returns AMBIGUOUS for a human to settle,
 * because an unpicked bad merge costs far more than a queue item.
 */
import { normalizeEmail, normalizePhone, normalizeName, PartyError } from './normalize';

/** Strength of a match key. Only STRONG keys may merge two existing parties. */
export type SignalStrength = 'STRONG' | 'WEAK';

export interface IdentitySignal {
  /** The platform account, if the customer was signed in. The strongest signal there is. */
  authUserId?: string | null;
  email?: string | null;
  /** Whether the email was proven (a confirmed link, an OAuth provider, a verified login). */
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  name?: string | null;
  /** The property the signal came from, and its own id for the customer there. */
  siteId: string;
  siteCustomerId?: string | null;
}

export interface MatchKey {
  key: string;
  strength: SignalStrength;
}

export interface PartyCandidate {
  partyId: string;
  /** The match keys this party is already known by. */
  keys: string[];
  createdAt?: Date | string | null;
}

export type ResolutionOutcome =
  /** Exactly one party matched on a strong key. */
  | 'MATCHED'
  /** Nothing matched; a new party should be created. */
  | 'NEW'
  /** Strong keys pointed at different parties. A human decides; nothing is merged. */
  | 'AMBIGUOUS'
  /** Only weak signals were available. Attach provisionally and flag for review. */
  | 'UNVERIFIED';

export interface Resolution {
  outcome: ResolutionOutcome;
  partyId: string | null;
  /** Keys that should be recorded against the party. */
  keys: MatchKey[];
  /** Every party a strong key pointed at — more than one means AMBIGUOUS. */
  conflicts: string[];
  reason: string;
}

/**
 * Deterministic, human-readable match keys.
 *
 * Readable rather than hashed on purpose: they live in the same database that already holds the
 * email, so hashing would add no protection while making every support question ("why were these
 * merged?") unanswerable without a reverse lookup.
 */
export function matchKeys(signal: IdentitySignal): MatchKey[] {
  if (!signal || !signal.siteId) {
    throw new PartyError('MISSING_SITE', 'An identity signal must say which property it came from');
  }
  const keys: MatchKey[] = [];

  if (signal.authUserId) {
    keys.push({ key: `auth:${String(signal.authUserId)}`, strength: 'STRONG' });
  }
  const email = normalizeEmail(signal.email);
  if (email) {
    keys.push({ key: `email:${email}`, strength: signal.emailVerified ? 'STRONG' : 'WEAK' });
  }
  const phone = normalizePhone(signal.phone ?? null);
  if (phone) {
    keys.push({ key: `phone:${phone}`, strength: signal.phoneVerified ? 'STRONG' : 'WEAK' });
  }
  // Scoped to its own site, so it identifies this customer record without ever colliding with
  // another property's numbering.
  if (signal.siteCustomerId) {
    keys.push({ key: `site:${signal.siteId}:${String(signal.siteCustomerId)}`, strength: 'STRONG' });
  }
  return keys;
}

function oldest(candidates: PartyCandidate[]): PartyCandidate {
  return candidates.reduce((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
    return bt < at ? b : a;
  });
}

/**
 * Resolve a signal against the parties already known to hold any of its keys.
 *
 * `candidates` is whatever the caller's store returns for those keys — this function does no
 * I/O, so the rule is testable in isolation and identical wherever it runs.
 */
export function resolveParty(signal: IdentitySignal, candidates: PartyCandidate[] = []): Resolution {
  const keys = matchKeys(signal);
  if (keys.length === 0) {
    return { outcome: 'NEW', partyId: null, keys, conflicts: [], reason: 'no usable identity signal' };
  }

  const strongKeys = new Set(keys.filter((k) => k.strength === 'STRONG').map((k) => k.key));
  const weakKeys = new Set(keys.filter((k) => k.strength === 'WEAK').map((k) => k.key));

  const strongMatches = candidates.filter((c) => (c.keys || []).some((k) => strongKeys.has(k)));
  const uniqueStrong = [...new Set(strongMatches.map((c) => c.partyId))];

  if (uniqueStrong.length === 1) {
    return { outcome: 'MATCHED', partyId: uniqueStrong[0]!, keys, conflicts: [], reason: 'matched on a verified key' };
  }
  if (uniqueStrong.length > 1) {
    // Two verified signals disagreeing is a genuine data question. Merging on a guess would
    // join two people's histories, so it stops here.
    return {
      outcome: 'AMBIGUOUS',
      partyId: null,
      keys,
      conflicts: uniqueStrong,
      reason: `verified keys point at ${uniqueStrong.length} different parties`,
    };
  }

  const weakMatches = candidates.filter((c) => (c.keys || []).some((k) => weakKeys.has(k)));
  const uniqueWeak = [...new Set(weakMatches.map((c) => c.partyId))];
  if (uniqueWeak.length === 1) {
    // Attach provisionally so the record is not orphaned, but never treat it as proven: an
    // unverified email is a claim, not evidence.
    return {
      outcome: 'UNVERIFIED',
      partyId: uniqueWeak[0]!,
      keys,
      conflicts: [],
      reason: 'matched only on an unverified key — attach provisionally and review',
    };
  }
  if (uniqueWeak.length > 1) {
    return { outcome: 'AMBIGUOUS', partyId: null, keys, conflicts: uniqueWeak, reason: 'unverified keys point at several parties' };
  }

  return { outcome: 'NEW', partyId: null, keys, conflicts: [], reason: 'no existing party holds any of these keys' };
}

export interface MergePlan {
  survivorId: string;
  mergedIds: string[];
  keys: string[];
}

/**
 * Plan a merge of parties a human has confirmed are the same person.
 *
 * The oldest party survives, so the id that has been referenced longest — by ledger lines,
 * entitlement grants, support tickets — stays valid, and the merge is recorded rather than
 * losing the other ids silently.
 */
export function planMerge(candidates: PartyCandidate[]): MergePlan {
  if (!Array.isArray(candidates) || candidates.length < 2) {
    throw new PartyError('INVALID_MERGE', 'A merge needs at least two parties');
  }
  const survivor = oldest(candidates);
  return {
    survivorId: survivor.partyId,
    mergedIds: candidates.filter((c) => c.partyId !== survivor.partyId).map((c) => c.partyId),
    keys: [...new Set(candidates.flatMap((c) => c.keys || []))],
  };
}

export { normalizeEmail, normalizePhone, normalizeName, PartyError };
