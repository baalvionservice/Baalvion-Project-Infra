/**
 * @fileOverview Appointment Service Main Entry
 * Decouples the UI from the backend implementation and triggers executive alerts/activities.
 */

import * as mockService from './appointment.mock';
import * as firebaseService from './appointment.firebase';
import { createNotification } from '@/services/notifications/notificationService';
import { assignLawyerToCase } from '@/services/cases/caseService';
import { createActivity } from '@/services/activities/activityService';
import { logAction } from '@/services/audit/auditService';
import { Appointment } from '@/types/appointment';

// Flag to toggle between Mock and Firebase implementations
const USE_MOCK = true;

/**
 * Initiates a new consultation appointment in the network ledger.
 */
export const createAppointment = async (data: Omit<Appointment, "status" | "createdAt" | "id" | "appointmentId">, userRole = 'client') => {
  const appointment = USE_MOCK 
    ? await mockService.mockCreateAppointment(data)
    : await firebaseService.firebaseCreateAppointment(data);

  const caseId = data.caseId;
  const clientId = data.clientId;

  // 1. Trigger Enhanced Notification
  await createNotification({
    userId: clientId,
    title: 'Consultation Scheduled',
    message: `Your executive consultation request for ${data.date} at ${data.time} has been successfully synchronized.`,
    type: 'status_changed',
    relatedCaseId: caseId
  });

  // 2. Log Activity
  await createActivity({
    caseId,
    type: 'appointment_booked',
    message: 'Executive consultation session scheduled and confirmed.',
    performedBy: clientId,
    metadata: { date: data.date, time: data.time }
  });

  // 3. Audit Log
  await logAction({
    userId: clientId,
    userRole,
    action: 'book_appointment',
    entityType: 'appointment',
    entityId: appointment.id || appointment.appointmentId || 'unknown',
    details: { date: data.date, time: data.time, lawyerId: data.lawyerId }
  });

  // 4. Automated Action: Assign lawyer to the linked case and activate it
  if (caseId && data.lawyerId) {
    await assignLawyerToCase(caseId, data.lawyerId);
  }

  return appointment;
};

/**
 * Retrieves all consultation records for a specific client.
 */
export const getAppointmentsByClient = async (userId: string) => {
  if (USE_MOCK) {
    return await mockService.mockGetAppointmentsByClient(userId);
  }
  return await firebaseService.firebaseGetAppointmentsByClient(userId);
};

/**
 * Terminates a consultation appointment.
 */
export const cancelAppointment = async (appointmentId: string, clientId: string) => {
  const result = USE_MOCK
    ? await mockService.mockCancelAppointment(appointmentId)
    : await firebaseService.firebaseCancelAppointment(appointmentId);

  // Trigger Enhanced Notification
  await createNotification({
    userId: clientId,
    title: 'Consultation Terminated',
    message: 'Your scheduled consultation engagement has been successfully removed from the active ledger.',
    type: 'status_changed'
  });

  return result;
};
