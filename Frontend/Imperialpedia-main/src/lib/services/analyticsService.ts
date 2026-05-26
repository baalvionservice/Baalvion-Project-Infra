/**
 * @fileOverview Analytics Service Layer.
 * Prepares the system for real data integration by providing a structured mock handshake.
 */

import { VisitorStats, TrafficTrendNode, PageStats, UserActivityNode } from '@/types/analytics';

export const analyticsService = {
  getVisitors: async (): Promise<VisitorStats> => {
    // In production, this would fetch from GA4 API or internal telemetry node
    await new Promise(r => setTimeout(r, 400));
    return {
      totalVisitors: 124500,
      activeUsers: 842,
      pageViews: 452000,
      bounceRate: 32.4,
      prevTotalVisitors: 110000,
      prevActiveUsers: 750,
      prevPageViews: 410000
    };
  },

  getTrafficTrend: async (): Promise<TrafficTrendNode[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [
      { date: '2024-03-01', visitors: 4200, sessions: 1200 },
      { date: '2024-03-02', visitors: 4500, sessions: 1350 },
      { date: '2024-03-03', visitors: 3800, sessions: 1100 },
      { date: '2024-03-04', visitors: 5200, sessions: 1600 },
      { date: '2024-03-05', visitors: 6100, sessions: 1900 },
      { date: '2024-03-06', visitors: 5800, sessions: 1850 },
      { date: '2024-03-07', visitors: 6500, sessions: 2100 },
    ];
  },

  getTopPages: async (): Promise<PageStats[]> => {
    await new Promise(r => setTimeout(r, 400));
    return [
      { url: '/articles/yield-curve-inversion', views: 12400, uniqueVisitors: 8500, avgTimeOnPage: '4m 32s', bounceRate: 24.5 },
      { url: '/glossary/stagflation', views: 8200, uniqueVisitors: 6100, avgTimeOnPage: '2m 15s', bounceRate: 18.2 },
      { url: '/financial-tools/compound-interest', views: 7500, uniqueVisitors: 5200, avgTimeOnPage: '6m 12s', bounceRate: 12.4 },
      { url: '/articles/future-of-defi', views: 6800, uniqueVisitors: 4900, avgTimeOnPage: '5m 45s', bounceRate: 28.1 },
    ];
  },

  getUserActivity: async (): Promise<UserActivityNode[]> => {
    await new Promise(r => setTimeout(r, 300));
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      users: Math.floor(Math.random() * 200) + 100
    }));
  }
};
