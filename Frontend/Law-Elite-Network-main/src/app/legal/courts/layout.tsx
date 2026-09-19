import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Courts';
const description = 'Courts referenced across Law Elite Network’s legal case coverage.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/legal/courts` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/legal/courts`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function CourtsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
