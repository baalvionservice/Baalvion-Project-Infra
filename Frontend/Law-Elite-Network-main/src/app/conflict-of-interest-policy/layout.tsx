import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Conflict of Interest Policy';
const description = "How Law Elite Network separates its commercial lawyer-referral business from independent editorial judgment, and how personal conflicts of interest are disclosed.";
export const metadata: Metadata = {
  title,
  description,
  keywords: ['conflict of interest policy', 'editorial independence', 'lawyer referral disclosure', 'commercial vs editorial separation'],
  alternates: { canonical: `${SITE}/conflict-of-interest-policy` },
  openGraph: { type: 'website', url: `${SITE}/conflict-of-interest-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
