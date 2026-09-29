import type { Metadata } from 'next';
import { generateMetadata } from '@/lib/seo';

export const metadata: Metadata = generateMetadata({
  title: 'Platform Status | Baalvion Connect',
  description: 'Live operational status for all Baalvion Connect services including the Marketplace API, Escrow Payments, AI Matching Engine, and Notifications.',
  path: '/status',
});

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return children;
}
