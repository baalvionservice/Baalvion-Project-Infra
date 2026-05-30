import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Careers';
const description = "Join Law Elite Network and help build the world's leading global legal network. Explore open roles and our culture.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/careers` },
  openGraph: { type: 'website', url: `${SITE}/careers`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
