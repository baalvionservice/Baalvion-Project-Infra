
import { UserRole } from "@/core/content/schemas";

export type DataRoomCategory = 'All' | 'Financial' | 'Governance' | 'Capital' | 'Legal';

export interface DocumentItem {
  id: string;
  title: string;
  category: Exclude<DataRoomCategory, 'All'>;
  allowedRoles: UserRole[];
  fileSize: string;
  lastUpdated: string;
  accessLevelLabel: 'Public' | 'Accredited' | 'Board Only' | 'Internal';
  mockDownloadUrl: string;
  description: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  role: UserRole;
  action: 'View' | 'Download' | 'Access Denied';
  documentName: string;
}
