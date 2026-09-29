import type { Metadata } from 'next';
import { phase2InvestorData } from '@/lib/phase2-data';
import DashboardContent from './DashboardContent';

export const metadata: Metadata = {
  title: 'Phase 2: SPV Dashboard | Baalvion',
  description: 'Manage your Special Purpose Vehicle investment, capital account, and view recent activity.',
};

export default function Phase2DashboardPage() {
  return <DashboardContent data={phase2InvestorData} />;
}