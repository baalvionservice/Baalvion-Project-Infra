import MarketingFooter from "../components/marketing-footer";
import MarketingHeader from "../components/marketing-header";
import PricingSection from "../components/pricing-section";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pricing',
    description: 'Choose the plan that\'s right for your empire. Simple, transparent pricing for businesses of all sizes.',
    openGraph: {
        title: 'Pricing | Baalvion',
        description: 'Choose the plan that\'s right for your empire. Simple, transparent pricing for businesses of all sizes.',
    }
}

export default function PricingPage() {
    return (
        <div className="bg-background text-foreground flex flex-col min-h-screen">
            <MarketingHeader />
            <main className="flex-grow pt-20">
                <PricingSection />
            </main>
            <MarketingFooter />
        </div>
    );
}
