/**
 * @fileOverview Core Availability Type definitions for the Law Elite Network.
 */

export interface Availability {
  id?: string;
  lawyerId: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
  slotDuration: number; // in minutes
  createdAt?: any;
}

export interface DayAvailability {
  date: string; // "2023-10-27"
  slots: string[]; // ["09:00", "09:30", ...]
}
