
/**
 * @fileOverview Core API Types and Data Transfer Objects (DTOs)
 * Standardized for future Node.js REST API compatibility.
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export type UserRole = 'lawyer' | 'client' | 'admin' | null;
export type ProfileStatus = 'active' | 'pending' | 'suspended';
export type BookingStatus = 'pending_payment' | 'payment_failed' | 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type SubscriptionTier = 'BASIC' | 'PRO' | 'ELITE';
export type NotificationType = 'booking_request' | 'booking_accepted' | 'booking_rejected' | 'new_message' | 'verification_update' | 'new_case_match';

export interface ApiError {
  code: string;
  message: string;
}

/**
 * DTO for User Identity
 */
export interface UserCore {
  uid: string;
  userId: string;
  email: string;
  name: string;
  roleId: UserRole;
  profileStatus: ProfileStatus;
  isVerified: boolean;
  subscriptionTier: SubscriptionTier;
  createdAt: any;
  updatedAt: any;
  lastLoginAt?: any;
}

/**
 * Migration Metadata for legacy reconciliation
 */
export interface MigrationMetadata {
  isMigrated: boolean;
  legacyId?: string;
  migrationDate?: string;
  version: string;
}

export interface WalletData {
  walletId: string;
  uid: string;
  balance: number;
  currency: string;
  updatedAt: any;
}

export interface TransactionData {
  transactionId: string;
  uid: string;
  type: 'payment' | 'earning' | 'refund' | 'withdrawal';
  amount: number;
  status: 'success' | 'failed' | 'pending';
  referenceId: string;
  description: string;
  createdAt: any;
}

export interface SubscriptionData {
  subscriptionId: string;
  uid: string;
  planId: SubscriptionTier;
  status: 'active' | 'expired' | 'cancelled';
  startDate: any;
  endDate: any;
  paymentId: string;
  createdAt: any;
}
