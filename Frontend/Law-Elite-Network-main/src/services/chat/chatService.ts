/**
 * @fileOverview Chat Service Orchestrator
 * Decouples the UI from real-time communication implementations.
 */

import * as firebaseService from './chat.firebase';
import * as mockService from './chat.mock';
import { createNotification } from '@/services/notifications/notificationService';
import { createActivity } from '@/services/activities/activityService';
import { logAction } from '@/services/audit/auditService';

const USE_MOCK = true;

export const sendMessage = async (data: {
  caseId: string;
  senderId: string;
  receiverId: string;
  text: string;
  userRole?: string;
}) => {
  const result = USE_MOCK 
    ? await mockService.mockSendMessage(data)
    : await firebaseService.firebaseSendMessage(data);

  // 1. Trigger Enhanced Notification for Receiver
  await createNotification({
    userId: data.receiverId,
    title: 'New Secure Message Received',
    message: 'A practitioner or client has broadcasted a secure intelligence update to your dossier channel.',
    type: 'case_updated',
    relatedCaseId: data.caseId
  });

  // 2. Log Activity
  await createActivity({
    caseId: data.caseId,
    type: 'message_sent',
    message: 'New intelligence broadcasted to the secure context-aware chat channel.',
    performedBy: data.senderId
  });

  // 3. Audit Log
  await logAction({
    userId: data.senderId,
    userRole: data.userRole || 'member',
    action: 'send_message',
    entityType: 'case',
    entityId: data.caseId,
    details: { textLength: data.text.length }
  });

  return result;
};

export const subscribeToMessages = (caseId: string, callback: (messages: any[]) => void) => {
  if (USE_MOCK) {
    const handler = () => {
      callback(mockService.mockGetMessages(caseId));
    };
    window.addEventListener('chat_update', handler);
    handler(); // Initial pull
    return () => window.removeEventListener('chat_update', handler);
  }
  return firebaseService.firebaseSubscribeToMessages(caseId, callback);
};

export const markAsRead = async (messageId: string) => {
  if (USE_MOCK) {
    return await mockService.mockMarkAsRead(messageId);
  }
  return await firebaseService.firebaseMarkAsRead(messageId);
};
