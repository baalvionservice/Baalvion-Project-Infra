/**
 * Onboarding-completion UX flag only.
 *
 * SECURITY (P0): the forgeable client role/session cookies (`baalvion_role`, `baalvion_session`,
 * `baalvion_verified`) have been REMOVED — the frontend never trusts a client-written role.
 * Roles come only from the verified access token. `baalvion_onboarded` is a non-credential UX hint
 * (it grants no access; route protection is the httpOnly refresh cookie + server-side authz).
 */
export const setAuthCookies = (data: { onboarded?: boolean }) => {
  if (typeof document === 'undefined') return;
  if (data.onboarded !== undefined) {
    document.cookie = `baalvion_onboarded=${data.onboarded}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
};

export const clearAuthCookies = () => {
  if (typeof document === 'undefined') return;
  const past = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  // Clear the current flag + purge any legacy forgeable role/session cookies from old builds.
  ['baalvion_onboarded', 'baalvion_role', 'baalvion_session', 'baalvion_verified'].forEach((n) => {
    document.cookie = `${n}=; ${past}`;
  });
};
