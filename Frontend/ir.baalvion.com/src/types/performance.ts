
import { UserRole } from "@/core/content/schemas";

export interface NavHistoryPoint {
  date: string;
  nav: number;
}

export interface IrrMetrics {
  netIRR: number;
  grossIRR: number;
  DPI: number;
  TVPI: number;
  RVPI: number;
}

export interface SpvPerformance {
  id: string;
  name: string;
  deployed: number;
  currentValue: number;
  gainPercent: number;
}

export interface CapitalTimelinePoint {
  period: string;
  called: number;
  distributed: number;
}

export interface PerformanceDocument {
  id: string;
  title: string;
  category: string;
  restrictedTo: UserRole[];
  lastUpdated: string;
  mockUrl: string;
}
