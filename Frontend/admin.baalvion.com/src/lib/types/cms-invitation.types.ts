import type { CmsRole } from '@/lib/types/cms-website.types';
import type { AuthorSocial } from '@/lib/types/cms-authors.types';

/**
 * Public (token-authenticated) view of a contributor invitation, returned by
 * `GET /cms/invitations/:token`. Everything here is safe to render before the
 * recipient has an account — the opaque token is the only credential.
 */
export interface InvitationDetails {
  /** Publication the writer is invited to (e.g. "Imperialpedia"). */
  publicationName: string;
  websiteId: string;
  /** Reserved seat — the CMS role the invite grants (defaults to Writer). */
  role: CmsRole;
  roleLabel: string;
  /** Address the invitation was reserved for. */
  email: string;
  /** Person who extended the invite, shown in the reveal. */
  inviterName?: string;
  /** Optional personal note from the editor. */
  personalNote?: string;
  /** ISO timestamp after which the token is no longer valid. */
  expiresAt: string;
  /** Server-computed lifecycle so the UI can short-circuit expired/used links. */
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  /** True when the reserved email already maps to a platform account. */
  hasAccount: boolean;
}

/**
 * Payload for `POST /cms/invitations/:token/accept`. The account itself (email,
 * passphrase, session) is established via auth-service's own /register or /login
 * moments earlier in the same flow — this call must be authenticated (the fresh
 * session's Bearer token) and only carries the E-E-A-T author profile.
 */
export interface AcceptInvitationPayload {
  authorProfile: {
    /** Public byline / display name. */
    name: string;
    /** Professional title, e.g. "Markets Correspondent". */
    title?: string;
    /** Credentials line powering E-E-A-T, e.g. "CFA · 12y in commodities". */
    credentials?: string;
    bio?: string;
    avatarUrl?: string;
    expertise: string[];
    social?: AuthorSocial;
  };
}

export interface AcceptInvitationResult {
  websiteId: string;
  /** Where to send the newly-minted contributor once they're in. */
  redirectTo: string;
}
