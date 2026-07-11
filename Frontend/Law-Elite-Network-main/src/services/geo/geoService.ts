/**
 * @fileOverview Geo Service — Country -> State -> City taxonomy for the
 * registration wizard and search filters. Backed by law-service /v1/geo
 * (public, no auth). Falls back to an empty list for countries outside the
 * starter geo set (see Backend/services/knowledge/law-service/db/migrations/0005).
 */
import { publicClient } from '@/lib/api/client';

export interface GeoState {
  id: number;
  country_code: string;
  name: string;
  code?: string | null;
}

export interface GeoCity {
  id: number;
  state_id: number;
  country_code: string;
  name: string;
}

function unwrap<T>(data: any): T {
  return (data && data.data !== undefined ? data.data : data) as T;
}

export const getStates = async (countryCode: string): Promise<GeoState[]> => {
  if (!countryCode) return [];
  const { data } = await publicClient.get('/geo/states', { params: { countryCode } });
  return unwrap<GeoState[]>(data) ?? [];
};

export const getCities = async (stateId: number | string): Promise<GeoCity[]> => {
  if (!stateId) return [];
  const { data } = await publicClient.get('/geo/cities', { params: { stateId } });
  return unwrap<GeoCity[]>(data) ?? [];
};
