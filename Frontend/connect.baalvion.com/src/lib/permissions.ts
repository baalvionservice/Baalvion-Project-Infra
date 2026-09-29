
import { TeamRole } from '@/types/team';

type Module = 'deals' | 'proposals' | 'campaigns' | 'analytics' | 'payments' | 'team' | 'settings';
type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'payout';

const PERMISSION_MATRIX: Record<TeamRole, Partial<Record<Module, Action[]>>> = {
  admin: {
    deals: ['view', 'create', 'edit', 'delete'],
    proposals: ['view', 'create', 'edit', 'delete', 'approve'],
    campaigns: ['view', 'create', 'edit', 'delete'],
    analytics: ['view'],
    payments: ['view', 'approve', 'payout'],
    team: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'edit']
  },
  manager: {
    deals: ['view', 'create', 'edit'],
    proposals: ['view', 'create', 'edit'],
    campaigns: ['view', 'edit'],
    analytics: ['view'],
    payments: ['view'],
    team: ['view'],
    settings: ['view']
  },
  viewer: {
    deals: ['view'],
    proposals: ['view'],
    campaigns: ['view'],
    analytics: ['view'],
    payments: ['view'],
    team: ['view'],
    settings: ['view']
  }
};

/**
 * RBAC Utility to check if a user role has permission for a specific action.
 */
export function hasPermission(role: TeamRole | string, module: Module, action: Action): boolean {
  const r = role.toLowerCase() as TeamRole;
  const permissions = PERMISSION_MATRIX[r];
  
  if (!permissions) return false;
  
  const moduleActions = permissions[module];
  if (!moduleActions) return false;
  
  return moduleActions.includes(action);
}
