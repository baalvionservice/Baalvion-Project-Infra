/**
 * @fileOverview Availability Mock Storage.
 * Simulates persistence for practitioner availability schedules.
 */

import { Availability } from "@/types/availability";

const STORAGE_KEY = "law_elite_availability";

export const getAvailabilityMock = (): Availability[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveAvailabilityMock = (data: Availability[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
