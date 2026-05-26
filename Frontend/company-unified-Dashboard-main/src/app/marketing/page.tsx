import HeroSection from './components/hero-section';
import LogosSection from './components/logos-section';
import FeaturesSection from './components/features-section';
import StatsBar from './components/stats-bar';
import HowItWorks from './components/how-it-works';
import MarketingFooter from './components/marketing-footer';
import MarketingHeader from './components/marketing-header';
import PricingSection from './components/pricing-section';
import FaqSection from './components/faq-section';
import TestimonialsSection from './components/testimonials-section';
import ComparisonTable from './components/comparison-table';
import BlogSection from './components/blog-section';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Baalvion | The Global Business Operating System',
    description: 'Manage all your businesses, employees, finances, and equity — across every country — from one intelligent dashboard.',
    openGraph: {
        title: 'Baalvion | The Global Business Operating System',
        description: 'Manage all your businesses, employees, finances, and equity — across every country — from one intelligent dashboard.',
        images: ['https://picsum.photos/seed/dashboard-screenshot/1200/630']
    }
}

export default function MarketingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MarketingHeader />
      <main className="flex-1">
        <HeroSection />
        <LogosSection />
        <FeaturesSection />
        <StatsBar />
        <TestimonialsSection />
        <HowItWorks />
        <ComparisonTable />
        <PricingSection />
        <BlogSection />
        <FaqSection />
      </main>
      <MarketingFooter />
    </div>
  );
}
