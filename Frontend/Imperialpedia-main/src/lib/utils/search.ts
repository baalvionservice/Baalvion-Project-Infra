import countries from '@/data/countries.json';
import companies from '@/data/companies.json';
import industries from '@/data/industries.json';
import technologies from '@/data/technologies.json';
import { SearchResult, SearchResultType } from '@/types/search';

/**
 * Core search utility to query the knowledge graph.
 */
export function searchEntities(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];

  const results: SearchResult[] = [];

  // Helper to push results
  const addResults = (data: any[], type: SearchResultType, path: string) => {
    data.forEach(item => {
      if (
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        item.tags?.some((t: string) => t.toLowerCase().includes(q))
      ) {
        results.push({
          id: item.id,
          type,
          title: item.name,
          snippet: item.description,
          route: `/${path}/${item.slug}`
        });
      }
    });
  };

  addResults(countries, 'country', 'countries');
  addResults(companies, 'company', 'companies');
  addResults(industries, 'industry', 'industries');
  addResults(technologies, 'technology', 'technologies');

  return results.slice(0, 10);
}
