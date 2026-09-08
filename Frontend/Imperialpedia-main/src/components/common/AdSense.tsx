'use client';

import { useEffect, useRef, useState } from 'react';
import { useAdSenseClientId } from './AdSenseClientContext';

// Extend window type for adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: (object | { push: (obj: object) => void })[];
  }
}

interface AdSenseUnitProps {
  slot: string;
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  responsive?: boolean;
  className?: string;
}

/**
 * Reusable AdSense Ad Unit Component
 * 
 * Usage:
 * <AdSenseUnit slot="1234567890" format="auto" />
 * 
 * @param slot - AdSense ad slot ID
 * @param format - Ad format type (default: 'auto')
 * @param responsive - Enable responsive ads (default: true)
 * @param className - Additional CSS classes
 */
export function AdSenseUnit({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
}: AdSenseUnitProps) {
  // Real, CMS-managed publisher ID threaded down from app/layout.tsx via
  // AdSenseClientProvider — see AdSenseClientContext.tsx for why this
  // replaced a direct process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID read (wrong,
  // never-configured env var name; every ad unit silently rendered nothing).
  const clientId = useAdSenseClientId();
  const insRef = useRef<HTMLModElement | null>(null);
  // null = undecided (reserve space), true = filled, false = collapse.
  const [filled, setFilled] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for adsbygoogle script to load, then push ad unit
    const loadAd = () => {
      try {
        if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
          window.adsbygoogle.push({});
        } else {
          // Script not loaded yet, retry after a delay
          setTimeout(loadAd, 100);
        }
      } catch (e) {
        console.error('AdSense error:', e);
      }
    };

    // Small delay to ensure script is available
    const timer = setTimeout(loadAd, 50);
    return () => clearTimeout(timer);
  }, [slot]); // Reload when slot changes

  // Collapse the reserved space when no ad arrives.
  //
  // The min-height below exists to stop the page jumping when a creative loads,
  // but it was unconditional: a slot that never fills held 250px of blank page
  // forever. On an article with three in-body units that is ~840px of dead space
  // between paragraphs, which is what it looked like — and it is guaranteed while
  // the account is unapproved, since nothing fills at all.
  //
  // AdSense stamps data-ad-status="filled" | "unfilled" on the <ins> once it has
  // decided, so watch for it. The timeout covers the cases where that never
  // happens — script blocked, request failed, no account — where the honest
  // outcome is also to collapse.
  useEffect(() => {
    const el = insRef.current;
    if (!el) return undefined;

    const read = () => {
      const status = el.getAttribute('data-ad-status');
      if (status === 'unfilled') setFilled(false);
      else if (status === 'filled') setFilled(true);
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });

    const giveUp = setTimeout(() => {
      if (!el.getAttribute('data-ad-status')) setFilled(false);
    }, 4000);

    return () => { observer.disconnect(); clearTimeout(giveUp); };
  }, [slot]);

  if (!clientId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'AdSense client ID unavailable — either the CMS has no adsensePublisherId configured (Website → SEO → Monetization) and NEXT_PUBLIC_ADSENSE_CLIENT is unset, or this component rendered outside <AdSenseClientProvider>.'
      );
    }
    return null;
  }

  return (
    // Reserves space for the ad before Google's script measures and resizes
    // the <ins> element. Without this, every ad slot starts at zero height
    // and the page jumps by the ad's real height (often 250px+) the moment
    // each one loads — a major cause of layout shift and janky scrolling on
    // pages with several ad units, like the homepage. Heights approximate
    // AdSense's typical responsive rectangle/banner sizes; the slot can still
    // grow taller if the served creative is bigger, it just never starts flat.
    <div
      className={filled === false ? '' : `min-h-[100px] sm:min-h-[250px] ${className}`}
      aria-hidden={filled === false ? true : undefined}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: filled === false ? 'none' : 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
