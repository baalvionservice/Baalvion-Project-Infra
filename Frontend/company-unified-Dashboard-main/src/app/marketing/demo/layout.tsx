import type { ReactNode } from 'react';
import MarketingHeader from '../components/marketing-header';
import MarketingFooter from '../components/marketing-footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Book a Demo',
    description: 'Schedule a 30-minute demo to see how Baalvion can transform your global operations.',
    openGraph: {
        title: 'Book a Demo | Baalvion',
        description: 'Schedule a 30-minute demo to see how Baalvion can transform your global operations.',
    }
}

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground flex flex-col min-h-screen">
        <MarketingHeader />
        <main className="flex-grow">
            {children}
        </main>
        <MarketingFooter />
    </div>
  );
}
