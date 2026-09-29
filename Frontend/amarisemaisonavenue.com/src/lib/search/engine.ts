
/**
 * @fileOverview Advanced Search Engine Module.
 * Provides hybrid logic combining keyword and semantic tracks.
 */

import { SemanticEngine, SemanticResult } from './semantic-engine';

export type EntityType = 'listings' | 'leads' | 'content' | 'products';

/**
 * Universal Hybrid Search Engine
 * Combines exact keyword matching with neural intent resonance.
 */
export async function applyAdvancedSearch<T>(
  data: T[],
  query: string = "",
  filters: Record<string, any> = {},
  role?: string,
  userCountry?: string
): Promise<T[]> {
  let results = [...data];

  // 1. RBAC + Country Isolation Enforcement
  if (role && role !== "super_admin" && userCountry && userCountry !== 'GLOBAL') {
    results = results.filter((item: any) => {
      const itemCountry = (item.country || item.countryCode || "").toLowerCase();
      return itemCountry === userCountry.toLowerCase() || item.isGlobal === true;
    });
  }

  // 2. Hybrid Logic Switch
  if (query.length > 3) {
    // Perform Semantic Discovery if query is a phrase
    const semanticResults = await SemanticEngine.search(query, results as any, 50);
    
    // Combine with Keyword results for hybrid ranking
    // For mock, we'll just prioritize semantic results if they have high resonance
    results = semanticResults
      .filter(res => res.resonanceScore > 0.4)
      .map(res => res.item as unknown as T);
  } else if (query) {
    // Fallback to strict keyword matching for short strings
    const q = query.toLowerCase();
    results = results.filter((item: any) => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(q)
      )
    );
  }

  // 3. Attribute Filters
  Object.entries(filters).forEach(([key, val]) => {
    if (val && val !== 'all') {
      results = results.filter((item: any) => {
        if (key === "priceRange" && Array.isArray(val)) {
          const price = item.basePrice || item.price;
          return price >= val[0] && price <= val[1];
        }
        return String(item[key]).toLowerCase() === String(val).toLowerCase();
      });
    }
  });

  return results;
}
