'use client';

/**
 * @fileOverview REST Activity Implementation
 * Replaces the previous Firebase/Firestore real-time implementation.
 */

import { apiClient } from '@/lib/api/client';

export const firebaseCreateActivity = async (data: {
  caseId: string;
  type: string;
  message: string;
  performedBy: string;
  metadata?: any;
}) => {
  try {
    await apiClient.post('/activities', data);
  } catch (error) {
    console.error('Activity log failure:', error);
  }
};

export const firebaseSubscribeToActivities = (
  caseId: string,
  callback: (activities: any[]) => void
): (() => void) => {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await apiClient.get('/activities', { params: { caseId } });
      callback(res.data?.data ?? []);
    } catch {
      // silently skip failed polls
    }
    if (active) {
      setTimeout(poll, 15_000);
    }
  };

  poll();

  return () => {
    active = false;
  };
};
