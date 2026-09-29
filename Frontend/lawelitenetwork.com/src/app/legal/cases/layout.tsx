import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Legal Cases — Courts, Parties, Lawyers & Judges';
const description = 'Reference profiles for notable legal cases on Law Elite Network — courts, parties, lawyers, judges, and timelines, factual and source-based.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['legal cases', 'court cases', 'lawyers', 'judges', 'law elite network legal'],
  alternates: { canonical: `${SITE}/legal/cases` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/legal/cases`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function LegalCasesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
