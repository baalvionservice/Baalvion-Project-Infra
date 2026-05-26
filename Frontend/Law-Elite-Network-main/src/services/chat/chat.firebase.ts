'use client';

/**
 * @fileOverview REST Chat Implementation
 * Replaces the previous Firebase/Firestore real-time implementation.
 * Polling is used in place of onSnapshot for message subscription.
 */

import { apiClient } from '@/lib/api/client';

export const firebaseSendMessage = async (data: {
  caseId: string;
  senderId: string;
  receiverId: string;
  text: string;
}) => {
  try {
    await apiClient.post('/messages', {
      ...data,
      isRead: false,
    });
  } catch (error) {
    console.error('Message delivery failure:', error);
    throw new Error('Unable to broadcast message to the network.');
  }
};

export const firebaseSubscribeToMessages = (
  caseId: string,
  callback: (messages: any[]) => void
): (() => void) => {
  let active = true;

  const poll = async () => {
    if (!active) return;
    try {
      const res = await apiClient.get('/messages', { params: { caseId } });
      callback(res.data?.data ?? []);
    } catch {
      // silently skip failed polls
    }
    if (active) {
      setTimeout(poll, 5_000);
    }
  };

  poll();

  return () => {
    active = false;
  };
};

export const firebaseMarkAsRead = async (messageId: string) => {
  try {
    await apiClient.patch(`/messages/${messageId}/read`);
  } catch (error) {
    console.error('Read-status sync failure:', error);
  }
};
