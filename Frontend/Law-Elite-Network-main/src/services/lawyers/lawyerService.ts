/**
 * @fileOverview Lawyer Identity Service Main Entry
 * Orchestrates the marketplace flow across the network.
 * LIVE: backed by the Node/Postgres law-service REST API (no mock, no Firebase).
 */

import * as api from './lawyer.api';

export const createLawyerProfile = async (data: any) => api.apiCreateLawyer(data);

export const getAllLawyers = async () => api.apiGetAllLawyers();

export const getLawyerById = async (id: string) => api.apiGetLawyerById(id);

export const searchLawyers = async (filters: {
  specialization?: string;
  minRating?: number;
  maxPrice?: number;
  query?: string;
  countryCode?: string;
}) => api.apiSearchLawyers(filters);

/** Active-lawyer counts per country, for the global "browse by country" directory. */
export const getCountries = async () => api.apiGetCountries();
