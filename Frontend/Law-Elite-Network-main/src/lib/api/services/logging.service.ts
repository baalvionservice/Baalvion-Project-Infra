
"use client";

import { LogRepository, LogLevel, SystemLog } from '../repositories/log.repository';

/**
 * @fileOverview LoggingService
 * Provides a standardized interface for system observability and production error tracking.
 * Features structured logs architected for future ingestion by ELK or Datadog.
 */
export class LoggingService {
  constructor(private repo: LogRepository) {}

  async log(level: LogLevel, message: string, context: any = {}, userId?: string) {
    // Sanitize context to prevent logging sensitive PII or secrets
    const sanitizedContext = { ...context };
    const restrictedKeys = ['password', 'token', 'apiKey', 'secret', 'signature'];
    
    restrictedKeys.forEach(key => {
      if (key in sanitizedContext) sanitizedContext[key] = '[REDACTED]';
    });

    const logEntry: SystemLog = {
      level,
      message,
      context: sanitizedContext,
      userId,
      platform: 'WEB_CLIENT',
      version: '2.4.0'
    };

    // Log to console in development only
    if (process.env.NODE_ENV === 'development') {
      const colors = { info: 'cyan', warning: 'orange', error: 'red' };
      console.log(`%c[${level.toUpperCase()}] ${message}`, `color: ${colors[level]}; font-weight: bold;`, sanitizedContext);
    }

    // Persist to Firestore Log Ledger
    return await this.repo.create(logEntry);
  }

  async info(message: string, context?: any, userId?: string) {
    return this.log('info', message, context, userId);
  }

  async warn(message: string, context?: any, userId?: string) {
    return this.log('warning', message, context, userId);
  }

  async error(message: string, context?: any, userId?: string) {
    return this.log('error', message, context, userId);
  }

  /**
   * High-fidelity performance monitoring utility.
   * Measures duration of critical paths (e.g. AI generation, Payment verification).
   */
  async trackPerformance(label: string, startTime: number, context: any = {}, userId?: string) {
    const duration = Date.now() - startTime;
    return this.info(`Performance: ${label}`, { ...context, durationMs: duration }, userId);
  }
}
