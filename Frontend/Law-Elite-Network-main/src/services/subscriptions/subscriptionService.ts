/**
 * @fileOverview Subscription Service Orchestrator
 * Primary entry point for professional standing and recurring revenue management.
 */

import * as mock from './subscription.mock';
import { createNotification } from '@/services/notifications/notificationService';
import { logAction } from '@/services/audit/auditService';

export const getPlansByRole = (role: string) => {
  return role === 'lawyer' ? mock.LAWYER_PLANS : mock.CLIENT_PLANS;
};

export const createSubscription = async (userId: string, planId: string, role = 'client') => {
  const result = await mock.mockCreateSubscription(userId, planId);

  await createNotification({
    userId,
    title: 'Professional Standing Upgraded',
    message: `Your account has been successfully transitioned to ${planId.toUpperCase()} status.`,
    type: 'status_changed',
    priority: 'high'
  });

  await logAction({
    userId,
    userRole: role,
    action: 'status_change',
    entityType: 'system',
    entityId: userId,
    details: { newPlan: planId, cycle: '30_day' }
  });

  return result;
};

export const getUserSubscription = async (userId: string) => {
  return await mock.mockGetSubscription(userId);
};

export const cancelSubscription = async (userId: string) => {
  return await mock.mockCancelSubscription(userId);
};