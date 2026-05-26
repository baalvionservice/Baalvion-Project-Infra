import { Company } from '@/types/company';

export async function fetchCompanies(): Promise<Company[]> {
  const response = await fetch('/api/companies');
  if (!response.ok) throw new Error('Failed to fetch companies');
  return response.json();
}
