import type { Metadata } from 'next';
import { operatorData } from '@/lib/phase3-data';
import DashboardContent from './DashboardContent';

export const metadata: Metadata = {
  title: 'Operator Dashboard | Baalvion',
  description: 'Track your strategic equity grant, vesting schedule, and performance KPIs.',
};

export default function Phase3DashboardPage() {
  return <DashboardContent data={operatorData} />;
}