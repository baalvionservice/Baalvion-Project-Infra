'use client';

import useSWR from 'swr';
import { analyticsService } from '../services/analytics.adapter';
import {
  AnalyticsFilters,
  ApplicationsByCountryItem,
} from '../domain/analytics.entity';

const getKey = (filters: AnalyticsFilters) => [
  'applicationsByCountry',
  JSON.stringify(filters),
];

/**
 * Country-wise application breakdown for the analytics dashboard.
 *
 * Loaded independently of the main dashboard payload so it can resolve on its
 * own (it derives counts from the /applications + /jobs feeds rather than the
 * single /analytics/hiring call).
 */
export const useApplicationsByCountry = (filters: AnalyticsFilters) => {
  const { data, error, isLoading } = useSWR<ApplicationsByCountryItem[]>(
    getKey(filters),
    () => analyticsService.getApplicationsByCountry(filters),
  );

  return {
    data: data ?? [],
    isLoading,
    isError: Boolean(error),
  };
};
