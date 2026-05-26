/**
 * @fileOverview Mock Availability Implementation
 */

import { Availability } from "@/types/availability";

const STORAGE_KEY = "law_elite_availability_v2";

const DEFAULT_AVAILABILITY: Availability[] = [
  { lawyerId: "lawyer_1", day: "Monday", startTime: "09:00", endTime: "12:00", slotDuration: 60 },
  { lawyerId: "lawyer_1", day: "Wednesday", startTime: "14:00", endTime: "17:00", slotDuration: 60 },
  { lawyerId: "lawyer_2", day: "Tuesday", startTime: "10:00", endTime: "16:00", slotDuration: 30 },
];

export const mockGetAvailabilityByLawyer = async (lawyerId: string): Promise<Availability[]> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const stored = localStorage.getItem(STORAGE_KEY);
  const all = stored ? JSON.parse(stored) : DEFAULT_AVAILABILITY;
  return all.filter((a: Availability) => a.lawyerId === lawyerId);
};

export const mockIsSlotBooked = async (lawyerId: string, date: string, time: string): Promise<boolean> => {
  const appointments = JSON.parse(localStorage.getItem("law_elite_appointments") || "[]");
  return appointments.some((apt: any) => 
    apt.lawyerId === lawyerId && 
    apt.date === date && 
    apt.time === time &&
    apt.status !== "cancelled"
  );
};
