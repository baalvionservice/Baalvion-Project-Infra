import { buildMetadata } from '@/lib/seo';
import SectorOverviewClient from './SectorOverviewClient';

export const metadata = buildMetadata({
  title: 'AI Sector Overview Generator | AI Analyst',
  description: 'Generate an AI-synthesized overview of an industry sector — leaders, laggards, and the forces driving performance.',
  canonical: '/ai-analyst/sector-overview',
});

export default function SectorOverviewPage() {
  return <SectorOverviewClient />;
}
