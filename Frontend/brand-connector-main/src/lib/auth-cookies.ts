
/**
 * Utility to manage client-side cookies for Middleware consumption.
 * Since we don't have JS-Cookie, we use native document.cookie.
 */

export const setAuthCookies = (data: {
  session?: string;
  role?: string;
  verified?: boolean;
  onboarded?: boolean;
}) => {
  if (typeof document === 'undefined') return;

  const expiry = 60 * 60 * 24 * 7; // 7 days
  const baseOptions = `path=/; max-age=${expiry}; SameSite=Lax`;

  if (data.session !== undefined) {
    document.cookie = `baalvion_session=${data.session}; ${baseOptions}`;
  }
  if (data.role !== undefined) {
    document.cookie = `baalvion_role=${data.role}; ${baseOptions}`;
  }
  if (data.verified !== undefined) {
    document.cookie = `baalvion_verified=${data.verified}; ${baseOptions}`;
  }
  if (data.onboarded !== undefined) {
    document.cookie = `baalvion_onboarded=${data.onboarded}; ${baseOptions}`;
  }
};

export const clearAuthCookies = () => {
  if (typeof document === 'undefined') return;
  const past = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = `baalvion_session=; ${past}`;
  document.cookie = `baalvion_role=; ${past}`;
  document.cookie = `baalvion_verified=; ${past}`;
  document.cookie = `baalvion_onboarded=; ${past}`;
};
