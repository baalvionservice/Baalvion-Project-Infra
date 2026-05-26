/**
 * @fileOverview Availability Service Entry Point
 * Orchestrates slot generation and booking validation.
 */

import * as mockService from './availability.mock';
import * as firebaseService from './availability.firebase';
import { Availability } from '@/types/availability';

const USE_MOCK = true;

/**
 * Generates valid time slots based on an availability template.
 */
export const generateTimeSlots = (availability: Availability): string[] => {
  const slots: string[] = [];
  try {
    const start = new Date(`2000-01-01T${availability.startTime}:00`);
    const end = new Date(`2000-01-01T${availability.endTime}:00`);
    let current = start;

    while (current < end) {
      const timeString = current.toTimeString().substring(0, 5);
      slots.push(timeString);
      current = new Date(current.getTime() + availability.slotDuration * 60000);
    }
  } catch (e) {
    console.error("Slot generation error:", e);
  }
  return slots;
};

/**
 * Retrieves all availability templates for a lawyer.
 */
export const getAvailabilityByLawyer = async (lawyerId: string) => {
  if (USE_MOCK) return await mockService.mockGetAvailabilityByLawyer(lawyerId);
  return await firebaseService.firebaseGetAvailabilityByLawyer(lawyerId);
};

/**
 * Checks if a specific slot is already reserved.
 */
export const isSlotBooked = async (lawyerId: string, date: string, time: string) => {
  if (USE_MOCK) return await mockService.mockIsSlotBooked(lawyerId, date, time);
  return await firebaseService.firebaseIsSlotBooked(lawyerId, date, time);
};

/**
 * High-level function to get all slots for a date with booking status.
 */
export const getSlotsForDate = async (lawyerId: string, date: string) => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const selectedDay = days[new Date(date).getDay()];
  
  const allAvailability = await getAvailabilityByLawyer(lawyerId);
  const template = allAvailability.find(a => a.day === selectedDay);

  if (!template) return [];

  const slots = generateTimeSlots(template);
  const processedSlots = await Promise.all(
    slots.map(async (time) => ({
      time,
      isBooked: await isSlotBooked(lawyerId, date, time)
    }))
  );

  return processedSlots;
};
