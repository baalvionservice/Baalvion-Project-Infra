
import {
  AnalyticsData,
  AnalyticsFilters,
  ApplicationsByCountryItem,
} from '../domain/analytics.entity';

export interface AnalyticsService {
  getDashboardData(filters: AnalyticsFilters): Promise<AnalyticsData>;
  getApplicationsByCountry(
    filters: AnalyticsFilters,
  ): Promise<ApplicationsByCountryItem[]>;
}
