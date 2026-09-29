import type { UserRole } from '@/lib/types/auth.types';

export const ROLES: Record<UserRole, { label: string; color: string; level: number }> = {
  super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', level: 100 },
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', level: 80 },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', level: 60 },
  manager: { label: 'Manager', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', level: 50 },
  editor: { label: 'Editor', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', level: 40 },
  member: { label: 'Member', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', level: 20 },
  viewer: { label: 'Viewer', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', level: 10 },
  support: { label: 'Support', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', level: 25 },
  developer: { label: 'Developer', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', level: 35 },
  analyst: { label: 'Analyst', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', level: 30 },
  finance: { label: 'Finance', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', level: 30 },
  compliance: { label: 'Compliance', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', level: 35 },
  moderator: { label: 'Moderator', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', level: 35 },
  readonly: { label: 'Read Only', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300', level: 5 },
};

export const ROLE_OPTIONS = Object.entries(ROLES).map(([value, { label }]) => ({
  value: value as UserRole,
  label,
}));

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'owner', 'admin'];
export const MANAGEMENT_ROLES: UserRole[] = [...ADMIN_ROLES, 'manager'];
export const CONTENT_ROLES: UserRole[] = [...MANAGEMENT_ROLES, 'editor'];

export const canManageRole = (actor: UserRole, target: UserRole): boolean =>
  ROLES[actor].level > ROLES[target].level;
