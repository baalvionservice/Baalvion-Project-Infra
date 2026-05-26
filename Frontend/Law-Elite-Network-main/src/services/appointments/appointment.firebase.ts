'use client';
/**
 * @fileOverview REST Appointment Implementation
 * Replaces the previous Firebase/Firestore implementation.
 */

import { apiClient } from '@/lib/api/client';
import { Appointment } from '@/types/appointment';

export const firebaseCreateAppointment = async (
  data: Omit<Appointment, 'status' | 'createdAt' | 'id' | 'appointmentId'>
) => {
  try {
    const res = await apiClient.post('/bookings', {
      ...data,
      status: 'pending',
    });

    const created = res.data?.data;
    return {
      id: created?.id ?? created?.appointmentId,
      appointmentId: created?.id ?? created?.appointmentId,
      ...data,
      status: 'pending',
      ...created,
    };
  } catch (error) {
    console.error('Appointment initialization failure:', error);
    throw new Error('Unable to synchronize appointment with the network.');
  }
};

export const firebaseGetAppointmentsByClient = async (userId: string) => {
  try {
    const res = await apiClient.get('/bookings', { params: { clientId: userId } });
    return res.data?.data ?? [];
  } catch (error) {
    console.error('Appointment retrieval failure:', error);
    throw new Error('Unable to retrieve appointments from the network.');
  }
};

export const firebaseCancelAppointment = async (appointmentId: string) => {
  try {
    await apiClient.patch(`/bookings/${appointmentId}/status`, { status: 'cancelled' });
    return { success: true };
  } catch (error) {
    console.error('Appointment cancellation failure:', error);
    throw new Error('Unable to terminate appointment in the network ledger.');
  }
};
