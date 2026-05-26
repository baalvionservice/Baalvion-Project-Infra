
"use client";

import { AnalyticsRepository } from '../repositories/analytics.repository';

/**
 * @fileOverview AnalyticsService
 * Provides non-blocking intelligence tracking for platform events.
 */
export class AnalyticsService {
  constructor(private repo: AnalyticsRepository) {}

  /**
   * Logs a professional event to the analytics stream.
   * Designed to be low-latency and fail-silent to protect the main app loop.
   */
  async logEvent(eventType: string, metadata: any = {}, uid?: string) {
    try {
      await this.repo.log(eventType, metadata, uid);
    } catch (e) {
      // Silent fail in production to ensure uptime
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Analytics log failed for ${eventType}`, e);
      }
    }
  }
}
