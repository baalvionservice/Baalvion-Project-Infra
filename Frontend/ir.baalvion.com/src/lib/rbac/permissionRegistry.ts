import { AppRole } from './roles';

/**
 * Institutional Permission Set
 */
export type AppPermission = 
  | 'VIEW_DASHBOARD'
  | 'VIEW_DATA_ROOM'
  | 'DOWNLOAD_DOCUMENT'
  | 'VOTE_RESOLUTION'
  | 'CREATE_CAPITAL_CALL'
  | 'CREATE_DISTRIBUTION'
  | 'APPROVE_INVESTOR'
  | 'PUBLISH_NAV'
  | 'VIEW_ADMIN_PANEL';

/**
 * Permission Registry: Single Source of Truth mapping permissions to roles.
 */
export const PERMISSION_REGISTRY: Record<AppPermission, AppRole[]> = {
  VIEW_DASHBOARD: ['p1_institutional', 'p2_spv', 'p3_operator', 'admin', 'compliance'],
  VIEW_DATA_ROOM: ['p1_institutional', 'p2_spv', 'admin', 'compliance'],
  DOWNLOAD_DOCUMENT: ['p1_institutional', 'p2_spv', 'admin'],
  VOTE_RESOLUTION: ['p1_institutional', 'p2_spv', 'p3_operator', 'admin'],
  CREATE_CAPITAL_CALL: ['admin'],
  CREATE_DISTRIBUTION: ['admin'],
  APPROVE_INVESTOR: ['admin', 'compliance'],
  PUBLISH_NAV: ['admin'],
  VIEW_ADMIN_PANEL: ['admin', 'compliance'],
};
