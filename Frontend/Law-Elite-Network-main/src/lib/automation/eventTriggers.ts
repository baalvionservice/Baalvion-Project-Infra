/**
 * @fileOverview Event Trigger Definitions for the Law Elite Network.
 * Standardized constants for the automation engine.
 */

export const EVENTS = {
  BOOKING_CREATED: "booking_created",
  PAYMENT_SUCCESS: "payment_success",
  LAWYER_VIEWED: "lawyer_viewed",
  INACTIVE_USER: "inactive_user",
} as const;

export type PlatformEvent = typeof EVENTS[keyof typeof EVENTS];
