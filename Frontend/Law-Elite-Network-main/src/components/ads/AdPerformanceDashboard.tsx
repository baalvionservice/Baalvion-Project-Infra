'use client';

import React, { useEffect, useState } from 'react';
import { useAdAnalytics } from '@/lib/ad-analytics';
import { useAdManager } from '@/components/ads/AdManager';

interface AdPerformanceCard {
  title: string;
  value: string | number;
  change?: number;
  format?: 'percentage' | 'number' | 'currency';
}

/**
 * Ad Performance Monitoring Dashboard
 * Displays real-time ad metrics and performance data
 *
 * Features:
 * - Live impression/click tracking
 * - CTR calculation
 * - Revenue estimation
 * - Placement performance breakdown
 *
 * @example
 * ```tsx
 * <AdPerformanceDashboard />
 * ```
 */
export function AdPerformanceDashboard() {
  const { getMetrics: getAdMetrics } = useAdManager();
  const { getMetrics: getAnalyticsMetrics } = useAdAnalytics();
  const [metrics, setMetrics] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Update metrics every 30 seconds
    const interval = setInterval(() => {
      try {
        const data = getAnalyticsMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    }, 30000);

    // Initial fetch
    try {
      const data = getAnalyticsMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }

    return () => clearInterval(interval);
  }, [getAnalyticsMetrics]);

  if (!isVisible || !metrics) return null;

  const performanceCards: AdPerformanceCard[] = [
    {
      title: 'Total Impressions',
      value: metrics.totalImpressions || 0,
      format: 'number',
    },
    {
      title: 'Total Clicks',
      value: metrics.totalClicks || 0,
      format: 'number',
    },
    {
      title: 'Click-Through Rate',
      value: `${((metrics.averageCTR || 0) * 100).toFixed(2)}%`,
      format: 'percentage',
    },
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-6 max-w-md z-50 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Ad Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Performance Cards */}
      <div className="space-y-3 mb-4">
        {performanceCards.map((card) => (
          <div key={card.title} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{card.title}</span>
            <span className="font-semibold text-gray-900">{card.value}</span>
          </div>
        ))}
      </div>

      {/* Placement Breakdown */}
      {metrics.byPlacement && Object.keys(metrics.byPlacement).length > 0 && (
        <div className="border-t pt-3 mt-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            By Placement
          </h4>
          <div className="space-y-1 text-xs">
            {Object.entries(metrics.byPlacement).map(([key, placement]: [string, any]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600 capitalize">
                  {placement.placement}
                </span>
                <span className="text-gray-900">
                  {placement.impressions} impressions
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t mt-3 pt-2 text-xs text-gray-500 flex justify-between">
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
        <button
          onClick={() => {
            const exported = getAdMetrics();
            console.log('Ad metrics:', exported);
          }}
          className="text-blue-600 hover:text-blue-700"
        >
          Export
        </button>
      </div>
    </div>
  );
}

/**
 * Toggle button for the ad performance dashboard
 * Place this in your admin or dev tools layout
 */
export function AdDashboardToggle() {
  return (
    <button
      className="fixed bottom-4 left-4 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-blue-700 z-50 text-lg font-bold"
      title="Toggle Ad Performance Dashboard"
      onClick={() => {
        // This should toggle the dashboard visibility
        const event = new CustomEvent('toggle-ad-dashboard');
        window.dispatchEvent(event);
      }}
    >
      📊
    </button>
  );
}
