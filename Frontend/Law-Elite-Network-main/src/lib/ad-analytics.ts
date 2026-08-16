/**
 * Ad Analytics Service
 * Handles tracking and aggregation of ad performance metrics
 */

export interface AdMetrics {
  sessionId: string;
  placement: string;
  slotId: string;
  impressions: number;
  clicks?: number;
  ctr?: number; // Click-through rate
  timestamp: Date;
}

export interface AggregatedMetrics {
  totalImpressions: number;
  totalClicks: number;
  averageCTR: number;
  byPlacement: Record<string, MetricsByPlacement>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface MetricsByPlacement {
  placement: string;
  impressions: number;
  clicks: number;
  ctr: number;
  revenue?: number; // Estimated or actual revenue
  rpk?: number; // Revenue per thousand impressions (CPM-like metric)
}

class AdAnalyticsService {
  private metricsBuffer: AdMetrics[] = [];
  private sessionMetrics: Map<string, AdMetrics> = new Map();

  /**
   * Record an ad impression
   */
  recordImpression(
    sessionId: string,
    placement: string,
    slotId: string
  ): void {
    const key = `${sessionId}:${placement}`;
    const existing = this.sessionMetrics.get(key);

    if (existing) {
      existing.impressions += 1;
    } else {
      const metric: AdMetrics = {
        sessionId,
        placement,
        slotId,
        impressions: 1,
        clicks: 0,
        ctr: 0,
        timestamp: new Date(),
      };
      this.sessionMetrics.set(key, metric);
      this.metricsBuffer.push(metric);
    }
  }

  /**
   * Record an ad click
   */
  recordClick(sessionId: string, placement: string, slotId: string): void {
    const key = `${sessionId}:${placement}`;
    const existing = this.sessionMetrics.get(key);

    if (existing) {
      existing.clicks = (existing.clicks || 0) + 1;
      existing.ctr = existing.clicks / existing.impressions;
    }
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(
    timeRangeStart?: Date,
    timeRangeEnd?: Date
  ): AggregatedMetrics {
    const start = timeRangeStart || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const end = timeRangeEnd || new Date();

    let filteredMetrics = Array.from(this.sessionMetrics.values());

    if (timeRangeStart || timeRangeEnd) {
      filteredMetrics = filteredMetrics.filter((m) => {
        const time = m.timestamp.getTime();
        return time >= start.getTime() && time <= end.getTime();
      });
    }

    const byPlacement: Record<string, MetricsByPlacement> = {};

    filteredMetrics.forEach((metric) => {
      if (!byPlacement[metric.placement]) {
        byPlacement[metric.placement] = {
          placement: metric.placement,
          impressions: 0,
          clicks: 0,
          ctr: 0,
        };
      }

      byPlacement[metric.placement].impressions += metric.impressions;
      byPlacement[metric.placement].clicks += metric.clicks || 0;
    });

    // Calculate CTR for each placement
    Object.values(byPlacement).forEach((placement) => {
      placement.ctr =
        placement.impressions > 0
          ? placement.clicks / placement.impressions
          : 0;
    });

    const totalImpressions = Object.values(byPlacement).reduce(
      (sum, p) => sum + p.impressions,
      0
    );
    const totalClicks = Object.values(byPlacement).reduce(
      (sum, p) => sum + p.clicks,
      0
    );

    return {
      totalImpressions,
      totalClicks,
      averageCTR: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
      byPlacement,
      timeRange: { start, end },
    };
  }

  /**
   * Export metrics to JSON (for sending to server/storage)
   */
  exportMetrics(): {
    metrics: AdMetrics[];
    aggregated: AggregatedMetrics;
    exportedAt: Date;
  } {
    return {
      metrics: Array.from(this.sessionMetrics.values()),
      aggregated: this.getAggregatedMetrics(),
      exportedAt: new Date(),
    };
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metricsBuffer = [];
    this.sessionMetrics.clear();
  }
}

// Singleton instance
export const adAnalyticsService = new AdAnalyticsService();

/**
 * Hook for using analytics service in components
 */
export function useAdAnalytics() {
  return {
    recordImpression: (
      sessionId: string,
      placement: string,
      slotId: string
    ) => adAnalyticsService.recordImpression(sessionId, placement, slotId),
    recordClick: (sessionId: string, placement: string, slotId: string) =>
      adAnalyticsService.recordClick(sessionId, placement, slotId),
    getMetrics: (start?: Date, end?: Date) =>
      adAnalyticsService.getAggregatedMetrics(start, end),
    exportMetrics: () => adAnalyticsService.exportMetrics(),
  };
}
