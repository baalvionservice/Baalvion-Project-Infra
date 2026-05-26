/**
 * @fileOverview Lawyer Identity Service Main Entry
 * Orchestrates the marketplace flow across the network.
 */

import * as mockService from './lawyer.mock';
import * as firebaseService from './lawyer.firebase';

const USE_MOCK = true;

export const getAllLawyers = async () => {
  if (USE_MOCK) {
    return await mockService.mockGetAllLawyers();
  }
  return await firebaseService.firebaseGetAllLawyers();
};

export const getLawyerById = async (id: string) => {
  if (USE_MOCK) {
    return await mockService.mockGetLawyerById(id);
  }
  return await firebaseService.firebaseGetLawyerById(id);
};

export const searchLawyers = async (filters: {
  specialization?: string;
  minRating?: number;
  maxPrice?: number;
  query?: string;
}) => {
  if (USE_MOCK) {
    return await mockService.mockSearchLawyers(filters);
  }
  return await firebaseService.firebaseSearchLawyers(filters);
};