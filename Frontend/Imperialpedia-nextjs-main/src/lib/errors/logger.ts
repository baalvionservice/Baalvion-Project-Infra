import { env } from '@/config/env';

/**
 * @fileOverview Centralized logging utility for the platform.
 */

const isDev = env.environment === 'development';

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    // Warnings are logged in all environments but structured differently if needed
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...args);
  },
  
  error: (message: string, error?: any, ...args: any[]) => {
    // Errors are always logged
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error, ...args);
    
    // Future integration point for services like Sentry or LogRocket
    if (!isDev) {
      // Send to production monitoring service
    }
  },
};
