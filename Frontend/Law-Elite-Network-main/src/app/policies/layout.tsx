import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Policies & Guidelines';
const description = 'Every editorial, privacy, and site policy governing Law Elite Network in one place — privacy, terms, editorial standards, corrections, and more.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/policies` },
  openGraph: { type: 'website', url: `${SITE}/policies`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
