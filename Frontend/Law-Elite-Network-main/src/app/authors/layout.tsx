import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
const title = 'Our Contributors & Editorial Team';
const description =
  'Meet the legal editors and writers behind Law Elite Network — the contributors who research, write, and review our worldwide legal-education guides.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: `${SITE}/authors` },
  robots: { index: true, follow: true },
  openGraph: { type: 'website', url: `${SITE}/authors`, title, description },
  twitter: { card: 'summary_large_image', title, description },
};

export default function AuthorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
