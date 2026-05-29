/**
 * @fileOverview Appointment Service — LIVE (law-service bookings / Postgres).
 * "Appointments" in the UI map to law-service bookings. No mock, no Firebase.
 */
import { bookingApi } from '@/lib/api/client';
import { adaptAppointment, unwrapList, unwrapOne } from '@/services/_law/adapters';

const toScheduledAt = (date?: string, time?: string) => {
  if (!date) return new Date().toISOString();
  const iso = time ? `${date}T${time.length === 5 ? time + ':00' : time}` : `${date}T09:00:00`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

export const createAppointment = async (data: any, _userRole = 'client') => {
  const res = await bookingApi.create({
    lawyer_id: data.lawyerId ? Number(data.lawyerId) : undefined,
    case_id: data.caseId ? Number(data.caseId) : undefined,
    type: data.type || 'consultation',
    scheduled_at: data.scheduledAt || toScheduledAt(data.date, data.time),
    duration: data.duration || 60,
    notes: data.notes || data.message || '',
  });
  return adaptAppointment(unwrapOne(res));
};

export const getAppointmentsByClient = async (_userId?: string) => {
  const res = await bookingApi.list({ limit: 100 });
  return unwrapList(res).map(adaptAppointment);
};

export const cancelAppointment = async (appointmentId: string, _clientId?: string) => {
  const res = await bookingApi.cancel(appointmentId);
  return adaptAppointment(unwrapOne(res));
};
