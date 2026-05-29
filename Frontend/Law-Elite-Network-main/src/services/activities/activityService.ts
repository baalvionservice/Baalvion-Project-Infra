/**
 * @fileOverview Activity Service — LIVE-safe. No Firebase, no mock.
 * Per-case activity feeds are not user-facing in the current backend (admin audit is
 * server-side). These are no-ops so call sites stay clean until an activity feed ships.
 */
export type ActivityType =
  | 'case_created' | 'lawyer_assigned' | 'status_changed'
  | 'appointment_booked' | 'message_sent' | 'document_uploaded';

export const createActivity = async (_data: {
  caseId: string; type: ActivityType; message: string; performedBy: string; metadata?: any;
}) => ({ success: true });

export const subscribeToActivities = (_caseId: string, callback: (activities: any[]) => void): (() => void) => {
  callback([]);
  return () => {};
};
