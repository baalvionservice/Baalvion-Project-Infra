/**
 * In-memory auth token holder (P0 remediation).
 *
 * Single source of truth for the access token + user across AuthContext, platformClient,
 * adminApiClient and the api/intent layer. Replaces the previous localStorage persistence
 * (`baalvion_access_token` / `baalvion_auth_user`). The refresh token is the httpOnly cookie;
 * nothing here is written to web storage, so it is cleared on reload and restored via the
 * cookie-refresh bootstrap in AuthContext.
 */
import type { AuthUser } from "@/lib/authClient";

let _accessToken: string | null = null;
let _user: AuthUser | null = null;

export const tokenStore = {
  getAccess: (): string | null => _accessToken,
  getUser: (): AuthUser | null => _user,
  set: (accessToken: string | null, user?: AuthUser | null): void => {
    _accessToken = accessToken;
    if (user !== undefined) _user = user;
  },
  clear: (): void => {
    _accessToken = null;
    _user = null;
  },
};
