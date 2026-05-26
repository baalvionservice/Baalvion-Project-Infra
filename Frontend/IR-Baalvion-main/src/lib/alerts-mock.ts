/**
 * @deprecated Use `alertApi.list()` from `@/lib/api-client` instead.
 * INITIAL_ALERTS is kept as a static fallback for components that have not
 * yet been wired to the live alertApi. Do not delete.
 */
import { InvestorAlert } from "@/types/alerts";

export const INITIAL_ALERTS: InvestorAlert[] = [
  {
    id: 'alt-101',
    title: 'Capital Call #4 Issued',
    message: 'A drawdown notice for 10% of remaining commitment has been issued for Project Olympus.',
    category: 'CapitalCall',
    priority: 'High',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    targetRoles: ['phase1', 'phase2', 'admin'],
    read: false,
    actionUrl: '/performance'
  },
  {
    id: 'alt-102',
    title: 'Q1 2026 NAV Revaluation',
    message: 'The fund NAV has been updated following the quarterly independent audit. Net growth: +4.2%.',
    category: 'NAVUpdate',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    targetRoles: ['phase1', 'phase2', 'phase3', 'admin', 'BoardMember'],
    read: true,
    actionUrl: '/performance'
  },
  {
    id: 'alt-103',
    title: 'New Board Briefcase Available',
    message: 'Confidential materials for the March Strategy Meeting have been uploaded to the vault.',
    category: 'Governance',
    priority: 'Medium',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    targetRoles: ['admin', 'BoardMember', 'compliance'],
    read: false,
    actionUrl: '/admin/board-materials'
  }
];
