import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Corrections Policy';
const description = "How to report an error on Law Elite Network and how we review, correct, and transparently timestamp updates to our legal content.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/corrections` },
  openGraph: { type: 'website', url: `${SITE}/corrections`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
