/**
 * @fileOverview Shared cookie-consent state (Google Consent Mode v2) — single
 * source of truth for CookieConsentBanner and any other control that needs to
 * grant or revoke consent (e.g. the "Do Not Sell or Share" action on the
 * privacy policy page). Consent is stored client-side only; nothing here
 * calls a backend.
 */

export const CONSENT_KEY = 'imperialpedia_cookie_consent';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
  interface Navigator {
    /** https://globalprivacycontrol.org/ — set by GPC-supporting browsers/extensions. */
    globalPrivacyControl?: boolean;
  }
}

export type ConsentChoice = 'accepted' | 'declined';

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  return stored === 'accepted' || stored === 'declined' ? stored : null;
}

/** Pushes the actual grant/deny state to Google Consent Mode v2 (gtag). */
export function updateGoogleConsent(granted: boolean): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  const state = granted ? 'granted' : 'denied';
  window.gtag('consent', 'update', {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}

/** Records the choice and applies it. The one place consent state changes. */
export function setConsent(accepted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, accepted ? 'accepted' : 'declined');
  updateGoogleConsent(accepted);
}

/** True when the browser/extension sends a Global Privacy Control signal. */
export function hasGlobalPrivacyControl(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.globalPrivacyControl === true;
}
