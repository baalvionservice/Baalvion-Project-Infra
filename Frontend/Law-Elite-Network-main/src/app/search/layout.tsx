import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Search Legal Guides & Resources';
const description = "Search plain-language legal guides and resources on Law Elite Network by topic, jurisdiction, or keyword.";
export const metadata: Metadata = {
  title,
  description,
  keywords: ['legal guide search', 'find legal resources', 'legal article search', 'search legal topics'],
  alternates: { canonical: `${SITE}/search` },
  openGraph: { type: 'website', url: `${SITE}/search`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
