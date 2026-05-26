import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Baalvion | The Global Business Operating System',
    template: '%s | Baalvion',
  },
  description: 'Manage all your businesses, employees, finances, and equity — across every country — from one intelligent dashboard.',
   openGraph: {
    title: 'Baalvion | The Global Business Operating System',
    description: 'Manage all your businesses, employees, finances, and equity — across every country — from one intelligent dashboard.',
    url: 'https://baalvion.com',
    siteName: 'Baalvion',
    images: [
      {
        url: 'https://picsum.photos/seed/og-image/1200/630',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};


export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground">
      {children}
    </div>
  );
}
