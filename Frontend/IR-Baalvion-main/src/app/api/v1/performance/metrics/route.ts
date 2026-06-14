import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/rbac/with-permission';

// Seed performance snapshot (standalone mode). Consumed by performanceApi.metrics (ir-engagement.ts),
// which returns json.data directly. Shapes match src/types/performance.ts.
const SNAPSHOT = {
  navHistory: [
    { date: '2022-Q1', nav: 10000000 },
    { date: '2022-Q2', nav: 10250000 },
    { date: '2022-Q3', nav: 10500000 },
    { date: '2022-Q4', nav: 10800000 },
    { date: '2023-Q1', nav: 11100000 },
    { date: '2023-Q2', nav: 11450000 },
    { date: '2023-Q3', nav: 11900000 },
    { date: '2023-Q4', nav: 12200000 },
    { date: '2024-Q1', nav: 12450000 },
  ],
  metrics: { netIRR: 18.4, grossIRR: 22.1, DPI: 0.42, TVPI: 1.38, RVPI: 0.96 },
  spvPerformance: [
    { id: 'spv-1', name: 'Logistics Infrastructure SPV', deployed: 3200000, currentValue: 4100000, gainPercent: 28.1 },
    { id: 'spv-2', name: 'Trade Finance SPV', deployed: 2500000, currentValue: 2950000, gainPercent: 18.0 },
    { id: 'spv-3', name: 'Compliance Tech SPV', deployed: 1800000, currentValue: 2160000, gainPercent: 20.0 },
  ],
  capitalTimeline: [
    { period: '2022', called: 3000000, distributed: 250000 },
    { period: '2023', called: 4000000, distributed: 600000 },
    { period: '2024', called: 1500000, distributed: 400000 },
  ],
  documents: [
    {
      id: 'doc-perf-1',
      title: 'Q1 2024 Factsheet',
      category: 'Factsheet',
      restrictedTo: ['p1_institutional', 'p2_spv', 'admin'],
      lastUpdated: '2024-04-15',
      mockUrl: '#',
    },
    {
      id: 'doc-perf-2',
      title: 'Annual Performance Report 2023',
      category: 'Report',
      restrictedTo: ['p1_institutional', 'p2_spv', 'p3_operator', 'admin'],
      lastUpdated: '2024-02-01',
      mockUrl: '#',
    },
  ],
};

export const GET = withPermission('VIEW_DASHBOARD', async () => {
  return NextResponse.json({ success: true, data: SNAPSHOT });
});
