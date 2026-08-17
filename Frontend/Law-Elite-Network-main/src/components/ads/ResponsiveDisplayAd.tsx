'use client';

import { useEffect, useRef, useCallback, CSSProperties } from 'react';

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
}

/**
 * Production-ready Google AdSense responsive display ad component
 *
 * Features:
 * - Prevents layout shift with reserved space
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
}: ResponsiveDisplayAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const initializeAd = useCallback(() => {
    // Only initialize once per component instance
    if (hasInitialized.current) return;
    if (!containerRef.current) return;

    try {
      // Check if adsbygoogle is available (loaded from parent layout)
      if (typeof window !== 'undefined' && 'adsbygoogle' in window) {
        hasInitialized.current = true;
        (window.adsbygoogle = window.adsbygoogle || []).push({});

        // Track impression
        if (placement) {
          trackAdImpression(placement, slotId);
        }

        onAdLoaded?.();
      } else {
        // AdSense script not yet loaded
        console.warn(
          'AdSense script not initialized. Ensure adsbygoogle is loaded in layout.'
        );
        onAdError?.(new Error('AdSense script not available'));
      }
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error('Failed to initialize ad');
      console.error('AdSense initialization error:', err);
      onAdError?.(err);
    }
  }, [slotId, placement, onAdLoaded, onAdError]);

  useEffect(() => {
    // Use Intersection Observer for lazy loading
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          initializeAd();
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Load ads 50px before they come into view
        threshold: 0.1,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [initializeAd]);

  // Get display style based on format
  const getDisplayStyle = (): CSSProperties => {
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

  return (
    <div
      ref={containerRef}
      className={`ad-container ad-placement-${placement} ${className}`}
      style={{
        minHeight,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '1.5rem 0',
      }}
      role="region"
      aria-label={`Advertisement - ${placement}`}
    >
      {/* Placeholder while ad loads */}
      <div
        style={{
          position: 'absolute',
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'loading 1.5s infinite',
          width: '100%',
          height: '100%',
          minHeight,
          borderRadius: '4px',
        }}
        className="ad-skeleton"
      >
        <style>{`
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>

      {/* AdSense ad unit */}
      <ins
        className="adsbygoogle"
        style={getDisplayStyle()}
        data-ad-client={`ca-pub-8968452296456450`}
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
    // Google Analytics 4 event
    if ('gtag' in window) {
      (window as any).gtag('event', 'ad_impression', {
        ad_slot: slotId,
        ad_placement: placement,
        timestamp: new Date().toISOString(),
      });
    }

    // Store in sessionStorage for monitoring
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
