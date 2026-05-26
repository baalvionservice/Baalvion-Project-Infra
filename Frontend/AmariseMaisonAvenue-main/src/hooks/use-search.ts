"use client";

import { useMemo, useEffect, useState } from "react";
import { applyAdvancedSearch } from "@/lib/search/engine";
import { useAppStore } from "@/lib/store";

/**
 * @fileOverview Hook for consuming the Search Engine within Maison UI components.
 */
export function useSearch<T>(
  data: T[],
  query: string,
  filters: Record<string, any> = {}
) {
  const { currentUser } = useAppStore();
  const [filteredResults, setFilteredResults] = useState<T[]>(data);

  useEffect(() => {
    const performSearch = async () => {
      const results = await applyAdvancedSearch(
        data,
        query,
        filters,
        currentUser?.role,
        currentUser?.country
      );
      setFilteredResults(results);
    };

    performSearch();
  }, [data, query, filters, currentUser]);

  return filteredResults;
}
