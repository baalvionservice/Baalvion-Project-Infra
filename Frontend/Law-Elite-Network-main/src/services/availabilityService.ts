/**
 * @fileOverview AvailabilityService
 * Primary service layer for managing practitioner schedules.
 */

import {
  getAvailabilityMock,
  saveAvailabilityMock,
} from "@/lib/mock/availabilityMock";
import { Availability } from "@/types/availability";

/**
 * Commits a practitioner's availability for a specific date to the network.
 */
export const setAvailability = async (availability: Availability): Promise<void> => {
  // Simulate network synchronization latency
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const existing = getAvailabilityMock();
  
  // Filter out any existing entries for the same date/lawyer to ensure record integrity
  const filtered = existing.filter(
    (a) => !(a.lawyerId === availability.lawyerId && a.date === availability.date)
  );
  
  const updated = [...filtered, availability];
  saveAvailabilityMock(updated);
};

/**
 * Retrieves the full availability dossier for a specific practitioner.
 */
export const getAvailabilityByLawyer = async (lawyerId: string): Promise<Availability[]> => {
  // Simulate data retrieval latency
  await new Promise(resolve => setTimeout(resolve, 500));
  const data = getAvailabilityMock();
  return data.filter((a) => a.lawyerId === lawyerId);
};
