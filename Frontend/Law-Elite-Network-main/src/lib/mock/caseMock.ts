/**
 * @fileOverview Case Mock Storage.
 * Simulates persistence for legal briefs and document management.
 */

export const getCasesMock = () => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem("law_elite_cases");
  return data ? JSON.parse(data) : [];
};

export const saveCasesMock = (data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem("law_elite_cases", JSON.stringify(data));
};
