'use client';

import { useEffect, useState } from 'react';

/**
 * Ad configuration for different placements
 */
export const AD_PLACEMENTS = {
  MID_ARTICLE: {
    id: 'mid-article',
    slotId: '4123514154',
    position: 'after_second_paragraph',
    minWords: 300,
    format: 'auto',
    label: 'Mid-Article Ad',
  },
  SIDEBAR_TOP: {
    id: 'sidebar-top',
    slotId: '4123514154',
    position: 'sidebar_top',
    format: 'vertical',
    label: 'Sidebar Top Ad',
  },
  SIDEBAR_BOTTOM: {
    id: 'sidebar-bottom',
    slotId: '4123514154',
    position: 'sidebar_bottom',
    format: 'vertical',
    label: 'Sidebar Bottom Ad',
  },
  FOOTER: {
    id: 'footer',
    slotId: '4123514154',
    position: 'footer',
    format: 'horizontal',
    label: 'Footer Ad',
  },
  CATEGORY_HERO: {
    id: 'category-hero',
    slotId: '4123514154',
    position: 'category_page_hero',
    format: 'auto',
    label: 'Category Page Ad',
  },
  MOBILE_INTERSTITIAL: {
    id: 'mobile-interstitial',
    slotId: '4123514154',
    position: 'mobile_interstitial',
    format: 'auto',
    label: 'Mobile Interstitial',
  },
} as const;

export type AdPlacementKey = keyof typeof AD_PLACEMENTS;

/**
 * Ad manager for tracking impressions, clicks, and performance metrics
 */
class AdManager {
  private impressions: Map<string, number> = new Map();
  private clicks: Map<string, number> = new Map();
  private startTime: number = Date.now();
  private sessionId: string = this.generateSessionId();

  generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track ad impression
   */
  trackImpression(placementId: string): void {
    this.impressions.set(
      placementId,
      (this.impressions.get(placementId) || 0) + 1
    );
    this.persistMetrics();

    // Log to analytics
    this.sendAnalyticsEvent('ad_impression', {
      placement: placementId,
      count: this.impressions.get(placementId),
    });
  }

  /**
   * Track ad click (optional - requires custom tracking)
   */
  trackClick(placementId: string): void {
    this.clicks.set(placementId, (this.clicks.get(placementId) || 0) + 1);
    this.persistMetrics();

    this.sendAnalyticsEvent('ad_click', {
      placement: placementId,
      count: this.clicks.get(placementId),
    });
  }

  /**
   * Get all ad metrics
   */
  getMetrics() {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      duration: Date.now() - this.startTime,
      impressions: Object.fromEntries(this.impressions),
      clicks: Object.fromEntries(this.clicks),
      totalImpressions: Array.from(this.impressions.values()).reduce(
        (a, b) => a + b,
        0
      ),
      totalClicks: Array.from(this.clicks.values()).reduce((a, b) => a + b, 0),
    };
  }

  /**
   * Reset metrics (for testing)
   */
  resetMetrics(): void {
    this.impressions.clear();
    this.clicks.clear();
    this.startTime = Date.now();
    sessionStorage.removeItem('ad_metrics');
  }

  /**
   * Persist metrics to sessionStorage
   */
  private persistMetrics(): void {
    try {
      sessionStorage.setItem('ad_metrics', JSON.stringify(this.getMetrics()));
    } catch (error) {
      console.error('Failed to persist ad metrics:', error);
    }
  }

  /**
   * Send event to Google Analytics
   */
  private sendAnalyticsEvent(
    eventName: string,
    eventData: Record<string, any>
  ): void {
    if (typeof window === 'undefined') return;

    try {
      if ('gtag' in window) {
        (window as any).gtag('event', eventName, {
          ...eventData,
          session_id: this.sessionId,
        });
      }
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }
}

// Singleton instance
const adManager = new AdManager();

/**
 * Hook for managing ad analytics in components
 *
 * @example
 * ```tsx
 * const { trackImpression, trackClick, getMetrics } = useAdManager();
 *
 * useEffect(() => {
 *   trackImpression('mid-article');
 * }, []);
 * ```
 */
export function useAdManager() {
  return {
    trackImpression: (placement: string) => adManager.trackImpression(placement),
    trackClick: (placement: string) => adManager.trackClick(placement),
    getMetrics: () => adManager.getMetrics(),
    resetMetrics: () => adManager.resetMetrics(),
  };
}

/**
 * Hook to initialize ad consent state based on cookie consent
 * Ensures ads only display when user has accepted ad-related cookies
 */
export function useAdConsent(): { isAdConsentGiven: boolean } {
  const [isAdConsentGiven, setIsAdConsentGiven] = useState(true); // Default to true for non-EU

  useEffect(() => {
    try {
      // Check if cookie consent is available
      const consentData = localStorage.getItem('law_elite_cookie_consent');
      if (consentData) {
        const consent = JSON.parse(consentData);
        // Ads require ad_storage and ad_personalization
        const adConsent =
          consent.ad_storage === true || consent.ad_personalization === true;
        setIsAdConsentGiven(adConsent);
      }
    } catch (error) {
      console.error('Failed to check ad consent:', error);
      setIsAdConsentGiven(true); // Fail open for non-EU
    }
  }, []);

  return { isAdConsentGiven };
}

/**
 * Export singleton for direct access
 */
export { adManager };
