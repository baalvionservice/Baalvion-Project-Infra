import { buildMetadata } from '@/lib/seo';
import RiskDetectionClient from './RiskDetectionClient';

export const metadata = buildMetadata({
  title: 'AI Risk Detection Tool | AI Analyst',
  description: 'Surface hidden risk factors for any asset with an AI-generated integrity audit — leverage, volatility, and exposure flags.',
  canonical: '/ai-analyst/risk-detection',
});

export default function RiskDetectionPage() {
  return <RiskDetectionClient />;
}
