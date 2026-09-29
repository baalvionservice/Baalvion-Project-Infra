'use client';

/**
 * @fileOverview Centralized Monitoring & Analytics Utility for Baalvion Mining Inc.
 * Provides abstractions for event tracking and error reporting with GA4 integration and PII filtering.
 */

type EventName = 
  | 'search_performed' 
  | 'product_view' 
  | 'rfq_created' 
  | 'bid_submitted' 
  | 'order_status_update' 
  | 'dispute_opened' 
  | 'payout_requested' 
  | 'admin_config_update'
  | 'hero_cta_click'
  | 'security_violation'
  | 'login'
  | 'sign_up'
  | 'contact_form_submit'
  | 'partnership_plan_generate';

/**
 * Tracks a user interaction or business event.
 * Bridges to window.gtag for Google Analytics 4.
 */
export const trackEvent = (name: EventName, params?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    // Sanitize parameters: Ensure no PII (emails, names) is sent in automated telemetry
    const sanitizedParams = { ...params };
    const piiFields = ['email', 'password', 'phone', 'name', 'firstName', 'lastName'];
    
    piiFields.forEach(field => {
      if (sanitizedParams[field]) delete sanitizedParams[field];
    });

    // 1. Log to Console for Development Oversight
    console.log(`[Telemetry Event]: ${name}`, sanitizedParams);

    // 2. Push to Google Analytics (GA4)
    if ((window as any).gtag) {
      (window as any).gtag('event', name, sanitizedParams);
    }
  }
};

/**
 * Reports a technical error to a centralized logging service.
 * Hardened to prevent sensitive information leak.
 */
export const reportError = (error: any, context?: string) => {
  if (typeof window !== 'undefined') {
    // In production, this would bridge to Sentry or Firebase Crashlytics
    const errorBody = {
      message: error?.message || "Unknown Application Error",
      context: context || 'Global Context',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    console.error(`[Security Logged Error]: ${errorBody.context}`, errorBody);

    // Track error as an event in GA4
    if ((window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `${context}: ${errorBody.message}`,
        fatal: false
      });
    }
  }
};
