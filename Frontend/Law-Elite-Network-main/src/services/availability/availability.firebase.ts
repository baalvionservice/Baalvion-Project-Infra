'use client';
/**
 * @fileOverview REST Availability Implementation
 * Replaces the previous Firebase/Firestore implementation.
 */

import { apiClient } from '@/lib/api/client';
import { Availability } from '@/types/availability';

export const firebaseGetAvailabilityByLawyer = async (lawyerId: string): Promise<Availability[]> => {
  try {
    const res = await apiClient.get(`/lawyers/${lawyerId}/availability`);
    return (res.data?.data as Availability[]) ?? [];
  } catch (error) {
    console.error('Availability retrieval failure:', error);
    return [];
  }
};

export const firebaseIsSlotBooked = async (lawyerId: string, date: string, time: string): Promise<boolean> => {
  try {
    const res = await apiClient.get('/bookings', {
      params: { lawyerId, date, time, excludeStatus: 'cancelled' }
    });
    const list = res.data?.data ?? [];
    return Array.isArray(list) && list.length > 0;
  } catch (error) {
    console.error('Booking check failure:', error);
    return false;
  }
};
