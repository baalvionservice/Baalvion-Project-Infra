/**
 * @fileOverview Practice Area Service — the fixed 14-item practice-area
 * lookup (registration wizard's Professional Details step + search filter).
 * Backed by law-service /v1/practice-areas (public, no auth).
 */
import { publicClient } from '@/lib/api/client';

export interface PracticeArea {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  order: number;
}

function unwrap<T>(data: any): T {
  return (data && data.data !== undefined ? data.data : data) as T;
}

export const getPracticeAreas = async (): Promise<PracticeArea[]> => {
  const { data } = await publicClient.get('/practice-areas');
  return unwrap<PracticeArea[]>(data) ?? [];
};
