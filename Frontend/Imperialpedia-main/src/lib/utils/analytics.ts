/**
 * @fileOverview Global Analytics & Event Tracking Utility.
 * Integrated with GA4 and GTM logic for high-fidelity behavior monitoring.
 */

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  non_interaction?: boolean;
}

/**
 * Checks for user privacy consent node.
 * Ensures compliance with GDPR/CCPA protocols before broadcasting telemetry.
 */
export const hasConsent = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('imperialpedia_cookie_consent') === 'accepted';
};

/**
 * Standard event logger for GA4.
 * Orchestrates the dispatch of custom events to the analytics cluster.
 * 
 * // TODO: AI-driven analytics insights  
 * // TODO: Dynamic reporting of top-performing sections and CTAs  
 * // TODO: Predictive analytics for user behavior and conversion
 */
export const logEvent = (action: string, category: string, label?: string, value?: number) => {
  if (hasConsent() && typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Legacy wrapper for AnalyticsEvent object structure.
 */
export const trackEvent = ({ category, action, label, value }: AnalyticsEvent) => {
  logEvent(action, category, label, value);
};

/** GA4 measurement id — configured per-environment, no hardcoded fallback. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Tracks a page view event.
 * Synchronized with the Next.js router cycle. No-op unless GA is configured
 * (NEXT_PUBLIC_GA_ID) and the visitor has consented.
 */
export const trackPageView = (path: string) => {
  if (GA_ID && hasConsent() && typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_ID, {
      page_path: path,
    });
  }
};
