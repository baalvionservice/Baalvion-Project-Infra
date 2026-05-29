/**
 * @fileOverview Availability Service — LIVE (law-service /lawyers/:id/availability).
 * Reads the lawyer's availability JSONB ({ mon: ['09:00-17:00'], ... }) from Postgres
 * and turns it into bookable slots. No mock, no Firebase.
 */
import { publicClient } from '@/lib/api/client';
import { Availability } from '@/types/availability';

const DAY_MAP: Record<string, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
};

export const generateTimeSlots = (availability: Availability): string[] => {
  const slots: string[] = [];
  try {
    const start = new Date(`2000-01-01T${availability.startTime}:00`);
    const end = new Date(`2000-01-01T${availability.endTime}:00`);
    let current = start;
    const step = (availability.slotDuration || 60) * 60000;
    while (current < end) {
      slots.push(current.toTimeString().substring(0, 5));
      current = new Date(current.getTime() + step);
    }
  } catch { /* ignore */ }
  return slots;
};

// Backend availability JSONB -> per-day templates the UI expects.
export const getAvailabilityByLawyer = async (lawyerId: string): Promise<any[]> => {
  try {
    const res = await publicClient.get(`/lawyers/${lawyerId}/availability`);
    const av = res?.data?.data?.availability || {};
    const out: any[] = [];
    for (const [key, ranges] of Object.entries(av)) {
      const day = DAY_MAP[String(key).slice(0, 3).toLowerCase()];
      const first = Array.isArray(ranges) ? ranges[0] : ranges;
      if (!day || !first || typeof first !== 'string') continue;
      const [startTime, endTime] = first.split('-');
      if (startTime && endTime) out.push({ day, startTime: startTime.trim(), endTime: endTime.trim(), slotDuration: 60 });
    }
    return out;
  } catch {
    return [];
  }
};

// No public "lawyer busy calendar" endpoint (a client only sees their own bookings),
// so slots are offered as available; the lawyer confirms/declines each request.
export const isSlotBooked = async (_lawyerId: string, _date: string, _time: string) => false;

export const getSlotsForDate = async (lawyerId: string, date: string) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedDay = days[new Date(date).getDay()];
  const allAvailability = await getAvailabilityByLawyer(lawyerId);
  const template = allAvailability.find((a) => a.day === selectedDay);
  if (!template) return [];
  return generateTimeSlots(template).map((time) => ({ time, isBooked: false }));
};
