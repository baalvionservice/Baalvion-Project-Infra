// Phase 5D — auth-sdk session bridge (DORMANT / additive). Reads the EXISTING Supabase-adapter
// session and exposes the unified canonical session { userId, orgId, roles[], permissions[] }.
//
// NON-BREAKING: the Supabase adapter (integrations/supabase/client.ts), .from() queries, storage,
// functions, and Firebase are ALL untouched. Nothing imports this yet, so the Vite build is
// unaffected until a component opts in. Resolution: cookie → adapter session (RS256) → guest.
//
// (The insiders twin gets the identical file; only SESSION_KEY/URLs differ if customized.)
import { createAuthSession } from '@baalvion/auth-sdk';

const AUTH_URL = (import.meta as any).env?.VITE_AUTH_URL || 'http://localhost:3001/v1/auth';
const SESSION_KEY = 'insiders.session'; // the adapter's localStorage session key (unchanged)

const readIsland = (): any => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; }
};

export const authSession = createAuthSession({
  authUrl: AUTH_URL,
  cookieMode: true,                                           // (1) cookie-aware (HttpOnly /me)
  getAccessToken: () => readIsland()?.access_token ?? null,   // (2) RS256 token from the adapter session
  readIslandSession: () => readIsland(),                      // (3) Supabase-adapter session (adapter UNTOUCHED)
});

/** Unified session helpers — old supabase.auth/useAuth keep working unchanged. */
export const getSession = () => authSession.getSession();
export const getUser = () => authSession.getUser();
export const logout = () => authSession.logout();
