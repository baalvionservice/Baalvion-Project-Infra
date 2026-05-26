/**
 * @fileOverview Booking Mock Storage.
 * Simulates persistence for executive consultation requests.
 */

import { Booking } from "@/types/booking";

export const saveBookingMock = async (booking: Booking): Promise<Booking> => {
  if (typeof window === 'undefined') return booking;
  
  const existing = JSON.parse(localStorage.getItem("law_elite_bookings") || "[]");
  const updated = [...existing, booking];
  
  localStorage.setItem("law_elite_bookings", JSON.stringify(updated));
  return booking;
};

export const getBookingsByUserIdMock = async (userId: string): Promise<Booking[]> => {
  if (typeof window === 'undefined') return [];
  
  const existing: Booking[] = JSON.parse(localStorage.getItem("law_elite_bookings") || "[]");
  return existing.filter(b => b.userId === userId);
};

export const getBookingsByLawyerIdMock = async (lawyerId: string): Promise<Booking[]> => {
  if (typeof window === 'undefined') return [];
  
  const existing: Booking[] = JSON.parse(localStorage.getItem("law_elite_bookings") || "[]");
  return existing.filter(b => b.lawyerId === lawyerId);
};
