import { Technology } from '@/types/technology';

export async function fetchTechnologies(): Promise<Technology[]> {
  const response = await fetch('/api/technologies');
  if (!response.ok) throw new Error('Failed to fetch technologies');
  return response.json();
}
