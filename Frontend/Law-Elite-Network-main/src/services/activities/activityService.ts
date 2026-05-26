/**
 * @fileOverview Activity Audit Service Orchestrator
 * Decouples the UI from the underlying audit implementations.
 */

import * as firebaseService from './activity.firebase';
import * as mockService from './activity.mock';

const USE_MOCK = true;

export type ActivityType = 
  | "case_created" 
  | "lawyer_assigned" 
  | "status_changed" 
  | "appointment_booked" 
  | "message_sent" 
  | "document_uploaded";

export const createActivity = async (data: {
  caseId: string;
  type: ActivityType;
  message: string;
  performedBy: string;
  metadata?: any;
}) => {
  if (USE_MOCK) {
    return await mockService.mockCreateActivity(data);
  }
  return await firebaseService.firebaseCreateActivity(data);
};

export const subscribeToActivities = (caseId: string, callback: (activities: any[]) => void) => {
  if (USE_MOCK) {
    const handler = () => {
      callback(mockService.mockGetActivities(caseId));
    };
    window.addEventListener('activity_sync', handler);
    handler(); // Initial pull
    return () => window.removeEventListener('activity_sync', handler);
  }
  return firebaseService.firebaseSubscribeToActivities(caseId, callback);
};
