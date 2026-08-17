'use client';

import { useEffect } from 'react';
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

  if (!clientId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'AdSense client ID unavailable — either the CMS has no adsensePublisherId configured (Website → SEO → Monetization) and NEXT_PUBLIC_ADSENSE_CLIENT is unset, or this component rendered outside <AdSenseClientProvider>.'
      );
    }
    return null;
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client={clientId}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
    />
  );
}

interface AdSenseContainerProps {
  slot: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Container wrapper for AdSense with optional children
 * Useful for layouts that need spacing or styling around the ad
 */
export function AdSenseContainer({
  slot,
  className = '',
  children,
}: AdSenseContainerProps) {
  return (
    <div className={`adsense-container ${className}`}>
      <AdSenseUnit slot={slot} />
      {children}
    </div>
  );
}
