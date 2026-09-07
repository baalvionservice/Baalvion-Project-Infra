import type { Metadata } from 'next';
import HomeClient from './HomeClient';

/**
 * The home page is a client component (it renders the CMS page-builder composition), so it could
 * not export metadata and fell back to the root layout's defaults. This thin server wrapper gives
 * the single most important page in the site its own title, description and canonical.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Baalvion | Institutional Investor Relations',
  description:
    'Baalvion Investor Relations — the investment thesis, governance and financials, plus a marketplace where founders raise from qualified investors and every deal is closed in a secure room.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Baalvion | Institutional Investor Relations',
    description: 'The investment story, governance and financials — and a marketplace connecting founders with qualified investors.',
    url: '/',
    type: 'website',
  },
};

export default function Page() {
  return <HomeClient />;
}
