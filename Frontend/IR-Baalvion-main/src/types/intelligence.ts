
import { UserRole } from "@/core/content/schemas";

export type AlertType = 'CapitalCall' | 'Distribution' | 'NAVUpdate' | 'Document' | 'Audit';

export interface InstitutionalAlert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: string;
  role: UserRole[];
  priority: 'High' | 'Medium' | 'Low';
  status: 'Unread' | 'Read';
}

export interface EsgMetric {
  spvId: string;
  spvName: string;
  score: number; // 0-100
  carbonFootprint: number; // Tons CO2e
  complianceScore: number; // 0-100
  socialImpact: number; // 0-100
}

export interface IntelligenceState {
  alerts: InstitutionalAlert[];
  esgMetrics: EsgMetric[];
  globalEsgScore: number;
}
