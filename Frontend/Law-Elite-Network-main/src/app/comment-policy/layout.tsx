import type { Metadata } from 'next';
const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Comment & Review Policy';
const description = "Rules for reader comments and lawyer reviews on Law Elite Network, our moderation process, and how we handle fake or coerced reviews in the directory.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/comment-policy` },
  openGraph: { type: 'website', url: `${SITE}/comment-policy`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};
export default function SeoLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
