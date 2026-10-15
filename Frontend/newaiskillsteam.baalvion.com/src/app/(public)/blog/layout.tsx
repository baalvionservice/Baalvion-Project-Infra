import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';

const blogUrl = absoluteUrl('/blog');

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Insights, guides, and industry research on skill-based hiring, talent verification, and the future of recruiting from the NEW AI Skills Team team.',
  alternates: {
    canonical: blogUrl,
  },
  openGraph: {
    url: blogUrl,
    title: 'Blog | NEW AI Skills Team',
    description:
      'Insights, guides, and industry research on skill-based hiring, talent verification, and the future of recruiting.',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
