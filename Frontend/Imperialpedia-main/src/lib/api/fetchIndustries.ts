import { Industry } from '@/types/industry';

export async function fetchIndustries(): Promise<Industry[]> {
  const response = await fetch('/api/industries');
  if (!response.ok) throw new Error('Failed to fetch industries');
  return response.json();
}
