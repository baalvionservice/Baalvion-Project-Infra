
import { 
  NavHistoryPoint, 
  IrrMetrics, 
  SpvPerformance, 
  CapitalTimelinePoint,
  PerformanceDocument 
} from "@/types/performance";

export const NAV_HISTORY: NavHistoryPoint[] = [
  { date: "2024-Q1", nav: 100000000 },
  { date: "2024-Q2", nav: 102500000 },
  { date: "2024-Q3", nav: 105000000 },
  { date: "2024-Q4", nav: 108200000 },
  { date: "2025-Q1", nav: 112000000 },
  { date: "2025-Q2", nav: 115500000 },
  { date: "2025-Q3", nav: 119800000 },
  { date: "2025-Q4", nav: 124500000 },
];

export const PERFORMANCE_METRICS: IrrMetrics = {
  netIRR: 0.184, // 18.4%
  grossIRR: 0.221,
  DPI: 0.45,
  TVPI: 1.38,
  RVPI: 0.93
};

export const SPV_PERFORMANCE: SpvPerformance[] = [
  { id: 'spv-1', name: 'Project Alpha (Growth Tech)', deployed: 40000000, currentValue: 58200000, gainPercent: 45.5 },
  { id: 'spv-2', name: 'Project Beta (Energy Infra)', deployed: 25000000, currentValue: 31000000, gainPercent: 24.0 },
  { id: 'spv-3', name: 'Project Gamma (Logistics)', deployed: 15000000, currentValue: 18500000, gainPercent: 23.3 },
  { id: 'spv-4', name: 'Project Delta (Fintech)', deployed: 10000000, currentValue: 12800000, gainPercent: 28.0 },
  { id: 'spv-5', name: 'Strategic Liquidity Pool', deployed: 10000000, currentValue: 10500000, gainPercent: 5.0 },
];

export const CAPITAL_TIMELINE: CapitalTimelinePoint[] = [
  { period: "2024-Q1", called: 50000000, distributed: 0 },
  { period: "2024-Q2", called: 10000000, distributed: 2500000 },
  { period: "2024-Q3", called: 5000000, distributed: 5000000 },
  { period: "2024-Q4", called: 15000000, distributed: 1200000 },
  { period: "2025-Q1", called: 8000000, distributed: 8500000 },
  { period: "2025-Q2", called: 12000000, distributed: 15000000 },
];

export const PERFORMANCE_DOCUMENTS: PerformanceDocument[] = [
  { id: 'doc-p1', title: 'Q4 2025 Audited Valuation Report', category: 'Audit', restrictedTo: ['p1_institutional', 'admin'], lastUpdated: '2026-01-15', mockUrl: '#' },
  { id: 'doc-p2', title: 'Detailed IRR Attribution Analysis', category: 'Performance', restrictedTo: ['p1_institutional', 'p2_spv', 'admin'], lastUpdated: '2026-01-20', mockUrl: '#' },
  { id: 'doc-p3', title: 'Portfolio Liquidity Framework', category: 'Governance', restrictedTo: ['admin', 'compliance'], lastUpdated: '2025-12-10', mockUrl: '#' },
];
