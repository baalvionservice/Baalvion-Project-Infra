'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ResponsiveDisplayAd } from './ResponsiveDisplayAd';
import { AD_PLACEMENTS } from './AdManager';

const CONSENT_KEY = 'law_elite_cookie_consent';
const DISMISS_KEY = 'law_elite_mobile_ad_dismissed';

/**
 * Sticky mobile-only anchor ad -- a slim bar pinned to the bottom of the
 * viewport, not a full-screen interstitial. Kept small (50px reserved) and
 * dismissible per Google's own anchor-ad policy (must not cover a large
 * share of the screen, must have a visible close control).
 *
 * Held back until the cookie-consent banner (also a fixed bottom bar) has
 * been answered, so the two never stack; dismissal is remembered only for
 * the tab session so it doesn't get re-asked on every page nav.
 */
export function MobileAnchorAd() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consentDecided = localStorage.getItem(CONSENT_KEY) !== null;
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
    if (consentDecided && !dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Advertisement"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 flex items-center gap-1 border-t border-slate-200 bg-white pl-1 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="min-w-0 flex-1">
        <ResponsiveDisplayAd
          slotId={AD_PLACEMENTS.MOBILE_INTERSTITIAL.slotId}
          placement="mobile-anchor"
          format="horizontal"
          fullWidthResponsive
          minHeight="50px"
        />
      </div>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1');
          setVisible(false);
        }}
        aria-label="Close advertisement"
        className="mr-1 shrink-0 self-start mt-1 rounded-full bg-slate-200 p-1 text-slate-600 hover:bg-slate-300 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
