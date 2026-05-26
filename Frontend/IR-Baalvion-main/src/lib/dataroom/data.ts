
import { DocumentItem } from "./types";

export const INSTITUTIONAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Q1 2026 Earnings Press Release',
    category: 'Financial',
    allowedRoles: ['public', 'phase1', 'phase2', 'phase3', 'admin', 'compliance', 'BoardMember'],
    fileSize: '1.2 MB',
    lastUpdated: '2026-02-10',
    accessLevelLabel: 'Public',
    mockDownloadUrl: '#',
    description: 'Quarterly financial performance summary and executive commentary.'
  },
  {
    id: 'doc-2',
    title: 'Q1 2026 Detailed Financial Statements',
    category: 'Financial',
    allowedRoles: ['phase1', 'phase2', 'phase3', 'admin', 'compliance', 'BoardMember'],
    fileSize: '4.5 MB',
    lastUpdated: '2026-02-10',
    accessLevelLabel: 'Accredited',
    mockDownloadUrl: '#',
    description: 'Audited P&L, Balance Sheet, and Cash Flow statements for Q1.'
  },
  {
    id: 'doc-3',
    title: 'Board Meeting Minutes - Jan 2026',
    category: 'Governance',
    allowedRoles: ['BoardMember', 'admin', 'compliance'],
    fileSize: '0.8 MB',
    lastUpdated: '2026-01-15',
    accessLevelLabel: 'Board Only',
    mockDownloadUrl: '#',
    description: 'Confidential summary of strategic board decisions and approvals.'
  },
  {
    id: 'doc-4',
    title: 'Internal Compliance Framework v4.2',
    category: 'Governance',
    allowedRoles: ['compliance', 'admin'],
    fileSize: '2.1 MB',
    lastUpdated: '2025-12-20',
    accessLevelLabel: 'Internal',
    mockDownloadUrl: '#',
    description: 'Proprietary regulatory monitoring and reporting protocols.'
  },
  {
    id: 'doc-5',
    title: 'Capital Call Notice - Series B-1',
    category: 'Capital',
    allowedRoles: ['phase1', 'phase2', 'admin', 'compliance', 'BoardMember'],
    fileSize: '0.5 MB',
    lastUpdated: '2026-02-01',
    accessLevelLabel: 'Accredited',
    mockDownloadUrl: '#',
    description: 'Official notification for scheduled capital contribution.'
  },
  {
    id: 'doc-6',
    title: 'SPV Structural Overview',
    category: 'Legal',
    allowedRoles: ['phase2', 'BoardMember', 'admin', 'compliance'],
    fileSize: '3.4 MB',
    lastUpdated: '2025-11-10',
    accessLevelLabel: 'Accredited',
    mockDownloadUrl: '#',
    description: 'Legal diagram and entity relationships for Project Olympus SPV.'
  },
  {
    id: 'doc-7',
    title: 'Master Subscription Agreement',
    category: 'Legal',
    allowedRoles: ['phase1', 'phase2', 'phase3', 'admin', 'compliance', 'BoardMember'],
    fileSize: '1.8 MB',
    lastUpdated: '2025-01-05',
    accessLevelLabel: 'Accredited',
    mockDownloadUrl: '#',
    description: 'Standard terms and conditions for institutional participation.'
  },
  {
    id: 'doc-8',
    title: 'Baalvion Governance Charter',
    category: 'Governance',
    allowedRoles: ['public', 'phase1', 'phase2', 'phase3', 'admin', 'compliance', 'BoardMember'],
    fileSize: '0.9 MB',
    lastUpdated: '2024-06-15',
    accessLevelLabel: 'Public',
    mockDownloadUrl: '#',
    description: 'Public disclosure of corporate governance principles.'
  }
];
