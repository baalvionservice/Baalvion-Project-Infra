import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Have a question or want to learn more about ControlTheMarket? Reach out to our team — we\'d love to hear from you.',
  alternates: {
    canonical: absoluteUrl('/contact'),
  },
  openGraph: {
    url: absoluteUrl('/contact'),
    title: 'Contact Us | ControlTheMarket',
    description:
      'Have a question or want to learn more about ControlTheMarket? Reach out to our team.',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
