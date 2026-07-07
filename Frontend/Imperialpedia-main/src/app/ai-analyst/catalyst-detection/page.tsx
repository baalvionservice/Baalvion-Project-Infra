import { buildMetadata } from '@/lib/seo';
import CatalystDetectionClient from './CatalystDetectionClient';

export const metadata = buildMetadata({
  title: 'AI Catalyst Detection | AI Analyst',
  description: 'Surface the upcoming events and data releases most likely to move an asset, detected and ranked by AI.',
  canonical: '/ai-analyst/catalyst-detection',
});

export default function CatalystDetectionPage() {
  return <CatalystDetectionClient />;
}
