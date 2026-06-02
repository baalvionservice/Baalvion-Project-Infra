import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Insights, guides, and industry research on skill-based hiring, talent verification, and the future of recruiting from the ControlTheMarket team.',
  alternates: {
    canonical: 'https://controlthemarket.com/blog',
  },
  openGraph: {
    url: 'https://controlthemarket.com/blog',
    title: 'Blog | ControlTheMarket',
    description:
      'Insights, guides, and industry research on skill-based hiring, talent verification, and the future of recruiting.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
