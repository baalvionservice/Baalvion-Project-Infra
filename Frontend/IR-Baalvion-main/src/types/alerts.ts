
import { UserRole } from "@/core/content/schemas";

export type AlertCategory = 'CapitalCall' | 'Distribution' | 'NAVUpdate' | 'Document' | 'Governance' | 'System';
export type AlertPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface InvestorAlert {
  id: string;
  title: string;
  message: string;
  category: AlertCategory;
  priority: AlertPriority;
  timestamp: string;
  targetRoles: UserRole[];
  read: boolean;
  actionUrl?: string;
}
