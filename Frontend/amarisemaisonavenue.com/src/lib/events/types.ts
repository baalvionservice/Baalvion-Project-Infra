/**
 * @fileOverview Global Event Bus Type Definitions
 * Standardizes asynchronous communication across Maison modules.
 */

import { CountryCode } from '../types';

export type EventStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'dead_letter';

export type MaisonEventType = 
  | 'order_created' 
  | 'order_confirmed'
  | 'order_failed'
  | 'payment_initiated'
  | 'payment_success'
  | 'payment_failed'
  | 'inventory_locked'
  | 'inventory_released'
  | 'inventory_confirmed'
  | 'refund_initiated'
  | 'notification_dispatched'
  | 'ai_insight_generated'
  | 'shipment_dispatched'
  | 'shipment_delivered';

export interface MaisonEvent<T = any> {
  id: string;
  type: MaisonEventType;
  source: 'orders' | 'payments' | 'inventory' | 'notifications' | 'ai' | 'analytics' | 'logistics';
  countryCode: CountryCode | 'global';
  payload: T;
  status: EventStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export type EventHandler = (event: MaisonEvent) => Promise<void>;
