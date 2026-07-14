import { buildMetadata } from '@/lib/seo';
import PositionSizeClient from './PositionSizeClient';

export const metadata = buildMetadata({
  canonical: '/financial-tools/position-size',
  title: 'Position Size Calculator',
  description: 'Size a stock trade based on your account risk budget, entry price, and stop-loss level.',
  keywords: ['Position Size Calculator', 'Risk Management', 'Stop Loss', 'Trading Risk'],
});

export default function PositionSizePage() {
  return <PositionSizeClient />;
}
