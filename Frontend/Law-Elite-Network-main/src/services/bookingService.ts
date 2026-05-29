/**
 * @fileOverview BookingService (top-level) — LIVE (law-service bookings / Postgres).
 * No mock, no localStorage, no Firebase. Endpoints are user-scoped by the session token.
 */
import { bookingApi } from '@/lib/api/client';
import { adaptAppointment, unwrapList, unwrapOne } from '@/services/_law/adapters';

const toScheduledAt = (data: any) => {
  if (data.scheduledAt || data.scheduled_at) return data.scheduledAt || data.scheduled_at;
  if (data.date) {
    const time = data.time ? (data.time.length === 5 ? `${data.time}:00` : data.time) : '09:00:00';
    const d = new Date(`${data.date}T${time}`);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
};

export const createBooking = async (data: any) => {
  const res = await bookingApi.create({
    lawyer_id: (data.lawyerId ?? data.lawyer_id) != null ? Number(data.lawyerId ?? data.lawyer_id) : undefined,
    case_id: (data.caseId ?? data.case_id) != null ? Number(data.caseId ?? data.case_id) : undefined,
    type: data.type || 'consultation',
    scheduled_at: toScheduledAt(data),
    duration: data.duration || 60,
    notes: data.notes || '',
  });
  return adaptAppointment(unwrapOne(res));
};

export const getUserBookings = async (_userId?: string) => {
  const res = await bookingApi.list({ limit: 100 });
  return unwrapList(res).map(adaptAppointment);
};

export const getMyBookings = async (_userId?: string) => getUserBookings();

export const getLawyerBookings = async (_lawyerId?: string) => getUserBookings();

export const getBookingById = async (id: string) => adaptAppointment(unwrapOne(await bookingApi.get(id)));

export const cancelBooking = async (id: string) => {
  await bookingApi.cancel(id);
  return true;
};
