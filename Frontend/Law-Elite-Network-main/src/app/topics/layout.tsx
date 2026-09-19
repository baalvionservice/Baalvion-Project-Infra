import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Topics';
const description = 'Cross-cutting subjects tagged automatically across every article on Law Elite Network.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/topics` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/topics`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function TopicsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
