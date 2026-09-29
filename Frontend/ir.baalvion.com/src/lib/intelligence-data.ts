
import { IntelligenceState } from "@/types/intelligence";

export const MOCK_INTELLIGENCE_DATA: IntelligenceState = {
  alerts: [
    {
      id: 'alt-001',
      type: 'CapitalCall',
      message: 'Urgent: 10% Capital Call issued for Project Olympus.',
      timestamp: '2026-02-15T09:00:00Z',
      role: ['phase1', 'phase2', 'admin'],
      priority: 'High',
      status: 'Unread'
    },
    {
      id: 'alt-002',
      type: 'NAVUpdate',
      message: 'Quarterly NAV revaluation confirmed: +4.2% Growth.',
      timestamp: '2026-02-14T14:30:00Z',
      role: ['phase1', 'phase2', 'phase3', 'admin', 'BoardMember'],
      priority: 'Medium',
      status: 'Read'
    },
    {
      id: 'alt-003',
      type: 'Audit',
      message: 'System-wide carbon footprint audit initiated by Governance Committee.',
      timestamp: '2026-02-12T11:00:00Z',
      role: ['admin', 'compliance', 'BoardMember'],
      priority: 'Low',
      status: 'Read'
    },
    {
      id: 'alt-004',
      type: 'Distribution',
      message: 'Dividend distribution of $1.2M approved for Series A holders.',
      timestamp: '2026-02-10T08:00:00Z',
      role: ['phase1', 'admin'],
      priority: 'High',
      status: 'Unread'
    }
  ],
  esgMetrics: [
    { spvId: 'spv-1', spvName: 'Alpha Tech', score: 88, carbonFootprint: 120, complianceScore: 95, socialImpact: 72 },
    { spvId: 'spv-2', spvName: 'Beta Infra', score: 64, carbonFootprint: 2450, complianceScore: 82, socialImpact: 85 },
    { spvId: 'spv-3', spvName: 'Gamma Log', score: 79, carbonFootprint: 840, complianceScore: 91, socialImpact: 68 },
    { spvId: 'spv-4', spvName: 'Delta Fin', score: 92, carbonFootprint: 45, complianceScore: 98, socialImpact: 90 },
  ],
  globalEsgScore: 81
};
