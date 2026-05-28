/**
 * firebase/auth-compatible shim. Auth is owned by Keycloak / the app's own
 * auth context now, so these are thin no-ops/bridges that keep call sites
 * compiling without pulling in Firebase. (Full Keycloak wiring is a separate step.)
 */
export type Auth = any;
export type User = any;

export function getAuth(_app?: any): Auth {
  return { currentUser: null };
}

/** Emits the current user once (none, until Keycloak is wired) then no-ops. */
export function onAuthStateChanged(_auth: any, next: (u: User | null) => void, _err?: any) {
  try { next(null); } catch { /* ignore */ }
  return () => {};
}

export async function signOut(_auth?: any) {
  /* token cleared by the app auth layer */
}

const keycloakNotice = 'Authentication is handled by Baalvion ID (Keycloak) — use the app login/signup.';

export async function signInWithEmailAndPassword(_a: any, _e: string, _p: string): Promise<any> {
  throw new Error(keycloakNotice);
}
export async function createUserWithEmailAndPassword(_a: any, _e: string, _p: string): Promise<any> {
  throw new Error(keycloakNotice);
}
export async function sendPasswordResetEmail(_a: any, _e: string) { /* Keycloak handles reset */ }
export async function confirmPasswordReset(_a: any, _code: string, _pw: string) { /* Keycloak */ }
export async function verifyPasswordResetCode(_a: any, _code: string) { return ''; }
export async function sendEmailVerification(_user: any) { /* Keycloak */ }
export class GoogleAuthProvider {}
export async function signInWithPopup(): Promise<any> {
  throw new Error(keycloakNotice);
}
