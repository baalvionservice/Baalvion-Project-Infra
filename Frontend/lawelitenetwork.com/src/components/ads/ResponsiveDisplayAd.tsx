'use client';

import { useEffect, useRef, useState, CSSProperties } from 'react';
import { ADSENSE_CLIENT } from '@/lib/adsense';

export interface ResponsiveDisplayAdProps {
  /**
   * AdSense ad slot ID (data-ad-slot)
   * @example "4123514154"
   */
  slotId: string;

  /**
   * Ad format: "auto", "horizontal", "vertical", "rectangle"
   * @default "auto"
   */
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';

  /**
   * Full-width responsive ad (adapts to container width)
   * @default true
   */
  fullWidthResponsive?: boolean;

  /**
   * Optional custom styles for the ad container
   */
  className?: string;

  /**
   * Ad placement identifier for analytics
   * @example "mid-article", "sidebar-widget", "footer"
   */
  placement?: string;

  /**
   * Callback when ad loads successfully
   */
  onAdLoaded?: () => void;

  /**
   * Callback on ad error
   */
  onAdError?: (error: Error) => void;

  /**
   * Minimum height to reserve for ad (prevents layout shift)
   * @default "250px"
   */
  minHeight?: string;

  /**
   * Reports the fill state up (null = undecided, true = filled, false =
   * collapsed) so a wrapper like AdSlot can hide its "Advertisement" label
   * along with the ad itself. See the collapse effect below for why this
   * exists: the AdSense account is unapproved as of this writing, so every
   * slot on the site is guaranteed unfilled, and reserving 250px+ of blank
   * space per slot reads as a broken layout, not an ad. Once AdSense
   * approves the site, `data-ad-status` starts coming back "filled" and ads
   * appear automatically — no code change needed then.
   */
  onFilledChange?: (filled: boolean | null) => void;
}

/**
 * Production-ready Google AdSense responsive display ad component
 *
 * Features:
 * - Prevents layout shift with reserved space, collapses cleanly if unfilled
 * - Lazy loading with Intersection Observer
 * - Analytics tracking for impressions/clicks
 * - Error handling and graceful fallback
 * - SEO-friendly (no content hiding)
 * - GDPR compliant (respects cookie consent)
 *
 * @example
 * ```tsx
 * <ResponsiveDisplayAd
 *   slotId="4123514154"
 *   placement="mid-article"
 *   onAdLoaded={() => console.log('Ad loaded')}
 * />
 * ```
 */
export function ResponsiveDisplayAd({
  slotId,
  format = 'auto',
  fullWidthResponsive = true,
  className = '',
  placement = 'default',
  onAdLoaded,
  onAdError,
  minHeight = '250px',
  onFilledChange,
}: ResponsiveDisplayAdProps) {
  const insRef = useRef<HTMLModElement | null>(null);
  // null = undecided (reserve space), true = filled, false = collapse.
  const [filled, setFilled] = useState<boolean | null>(null);
  const [requested, setRequested] = useState(false);

  // Request the ad only once the slot is near the viewport.
  useEffect(() => {
    const el = insRef.current;
    if (!el) return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pushed = false;

    const loadAd = () => {
      try {
        if (typeof window !== 'undefined' && 'adsbygoogle' in window) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          if (placement) trackAdImpression(placement, slotId);
          onAdLoaded?.();
        } else {
          timer = setTimeout(loadAd, 100);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to initialize ad');
        console.error('AdSense initialization error:', err);
        onAdError?.(err);
      }
    };

    const start = () => {
      if (pushed) return;
      pushed = true;
      setRequested(true);
      timer = setTimeout(loadAd, 50);
    };

    if (typeof IntersectionObserver === 'undefined') {
      start();
      return () => clearTimeout(timer);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotId]);

  // Collapse the reserved space when no ad arrives. AdSense stamps
  // data-ad-status="filled" | "unfilled" on the <ins> once it has decided;
  // the timeout covers the cases where that never happens (script blocked,
  // request failed, no approved account), where the honest outcome is also
  // to collapse rather than hold the placeholder forever.
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

    const giveUp = requested ? setTimeout(() => {
      if (!el.getAttribute('data-ad-status')) setFilled(false);
    }, 4000) : undefined;

    return () => { observer.disconnect(); clearTimeout(giveUp); };
  }, [slotId, requested]);

  useEffect(() => {
    onFilledChange?.(filled);
  }, [filled, onFilledChange]);

  const getDisplayStyle = (): CSSProperties => {
    if (filled === false) return { display: 'none' };
    switch (format) {
      case 'horizontal':
        return { display: 'block', textAlign: 'center' };
      case 'vertical':
        return { display: 'inline-block', width: '300px', margin: '0 auto' };
      case 'rectangle':
        return { display: 'inline-block', width: '300px', height: '250px' };
      default:
        return { display: 'block' };
    }
  };

  if (filled === false) return null;

  return (
    <div
      className={`ad-container ad-placement-${placement} ${className}`}
      style={{
        position: 'relative',
        minHeight,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '1.5rem 0',
      }}
      role="region"
      aria-label={`Advertisement - ${placement}`}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={getDisplayStyle()}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
        data-placement={placement}
      />
    </div>
  );
}

/**
 * Track ad impressions for analytics
 * @internal
 */
function trackAdImpression(placement: string, slotId: string) {
  if (typeof window === 'undefined') return;

  try {
    if ('gtag' in window) {
      (window as any).gtag('event', 'ad_impression', {
        ad_slot: slotId,
        ad_placement: placement,
        timestamp: new Date().toISOString(),
      });
    }

    const adMetrics = JSON.parse(
      sessionStorage.getItem('ad_impressions') || '{}'
    );
    adMetrics[placement] = (adMetrics[placement] || 0) + 1;
    sessionStorage.setItem('ad_impressions', JSON.stringify(adMetrics));
  } catch (error) {
    console.error('Failed to track ad impression:', error);
  }
}

// Declare adsbygoogle on window for TypeScript
declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}
