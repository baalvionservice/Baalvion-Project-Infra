/**
 * @fileOverview LawyerService
 * Primary service layer for practitioner discovery and management.
 * Bridges the UI with either Mock Storage or a real API.
 */

import { getLawyerProfileMock, updateLawyerProfileMock } from "@/lib/mock/lawyerMock";
import { lawyerListMock } from "@/lib/mock/lawyerListMock";

/**
 * Retrieves the specialized professional profile for a practitioner.
 */
export const getLawyerProfile = async (userId: string) => {
  return await getLawyerProfileMock(userId);
};

/**
 * Updates the specialized professional dossier for a practitioner.
 */
export const updateLawyerProfile = async (userId: string, data: any) => {
  return await updateLawyerProfileMock(userId, data);
};

/**
 * Retrieves a specific practitioner by their unique identifier.
 */
export const getLawyerById = async (id: string) => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 300));
  return lawyerListMock.find((l) => l.id === id);
};

/**
 * Retrieves all practitioners in the elite marketplace.
 */
export const getAllLawyers = async () => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  return lawyerListMock;
};

/**
 * Filters practitioners based on keyword search across names and specializations.
 */
export const searchLawyers = async (query: string) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const normalizedQuery = query.toLowerCase();
  return lawyerListMock.filter(
    (lawyer) =>
      lawyer.name.toLowerCase().includes(normalizedQuery) ||
      lawyer.specialization.toLowerCase().includes(normalizedQuery) ||
      lawyer.city.toLowerCase().includes(normalizedQuery)
  );
};
