import { buildMetadata } from '@/lib/seo';
import ModelPerformanceClient from './ModelPerformanceClient';

export const metadata = buildMetadata({
  title: 'AI Model Performance Report | AI Analyst',
  description: 'Review how the Imperialpedia AI analyst models have performed — accuracy, drift, and integrity reporting over time.',
  canonical: '/ai-analyst/model-performance',
});

export default function ModelPerformancePage() {
  return <ModelPerformanceClient />;
}
