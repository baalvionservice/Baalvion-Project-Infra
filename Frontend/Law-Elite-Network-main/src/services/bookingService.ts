/**
 * @fileOverview BookingService
 * Primary service layer for consultation scheduling and management.
 */

import { Booking } from "@/types/booking";
import { 
  saveBookingMock, 
  getBookingsByUserIdMock, 
  getBookingsByLawyerIdMock 
} from "@/lib/mock/bookingMock";

/**
 * Initiates a new consultation booking.
 */
export const createBooking = async (data: Booking): Promise<Booking> => {
  // Simulate network latency for professional feel
  await new Promise(resolve => setTimeout(resolve, 800));
  return await saveBookingMock(data);
};

/**
 * Retrieves engagements for a specific client.
 */
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return await getBookingsByUserIdMock(userId);
};

/**
 * Retrieves a specific booking by its unique identifier.
 */
export const getBookingById = async (id: string): Promise<Booking | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const bookings: Booking[] = JSON.parse(localStorage.getItem("law_elite_bookings") || "[]");
  return bookings.find((b) => b.id === id) || null;
};

/**
 * Terminates an engagement within the network.
 */
export const cancelBooking = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const bookings: Booking[] = JSON.parse(localStorage.getItem("law_elite_bookings") || "[]");
  
  const updated = bookings.map((b) => 
    b.id === id ? { ...b, status: "cancelled" as const } : b
  );
  
  localStorage.setItem("law_elite_bookings", JSON.stringify(updated));
  return true;
};

/**
 * Retrieves engagements for a specific client (Alias for consistency).
 */
export const getMyBookings = async (userId: string): Promise<Booking[]> => {
  return await getUserBookings(userId);
};

/**
 * Retrieves engagements for a specific practitioner.
 */
export const getLawyerBookings = async (lawyerId: string): Promise<Booking[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const existing: Booking[] = JSON.parse(localStorage.getItem("law_elite_bookings") || "[]");
  return existing.filter(b => b.lawyerId === lawyerId);
};
