/**
 * @fileOverview SearchSuggestionEngine
 * Logic for generating real-time search suggestions based on network data and user history.
 */

export const getSuggestions = (
  query: string,
  lawyers: any[],
  history: string[]
): string[] => {
  if (!query || query.length < 2) return [];

  const suggestions = new Set<string>();
  const normalizedQuery = query.toLowerCase();

  // 1. Suggest from Lawyer Specializations (Domain Expertise)
  lawyers.forEach((lawyer) => {
    const specs = Array.isArray(lawyer.specialization) 
      ? lawyer.specialization 
      : [lawyer.specialization];
    
    specs.forEach((spec: string) => {
      if (spec.toLowerCase().includes(normalizedQuery)) {
        suggestions.add(spec);
      }
    });
  });

  // 2. Suggest from User History (Personalized Intent)
  history.forEach((item) => {
    if (item.toLowerCase().includes(normalizedQuery)) {
      suggestions.add(item);
    }
  });

  // Return unique suggestions, prioritizing results and limiting to top 5
  return Array.from(suggestions).slice(0, 5);
};
