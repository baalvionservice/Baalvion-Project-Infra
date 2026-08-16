import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'AI Usage Policy';
const description = "How Law Elite Network uses AI as a drafting aid, why every article is reviewed by qualified human editors, and how readers can flag AI-related concerns.";
export const metadata: Metadata = {
  title,
  description,
  keywords: ['AI usage policy', 'AI-assisted legal content', 'human-reviewed AI content', 'responsible AI disclosure'],
  alternates: { canonical: `${SITE}/ai-usage-policy` },
  openGraph: { type: 'website', url: `${SITE}/ai-usage-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
