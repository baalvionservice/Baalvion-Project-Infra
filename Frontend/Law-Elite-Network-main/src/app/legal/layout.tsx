import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Legal Knowledge Base';
const description = "Browse expert legal articles and resources by topic and jurisdiction on the Law Elite Network knowledge base.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/legal` },
  openGraph: { type: 'website', url: `${SITE}/legal`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
