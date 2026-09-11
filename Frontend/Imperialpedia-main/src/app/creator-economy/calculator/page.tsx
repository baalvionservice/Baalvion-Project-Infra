import { buildMetadata } from '@/lib/seo';
import { Container } from '@/design-system/layout/container';
import { CreatorEarningsCalculator } from '@/components/creator/CreatorEarningsCalculator';
import { Breadcrumbs } from '@/modules/seo-engine/components/Breadcrumbs';
import { JsonLd } from '@/modules/seo-engine/components/JsonLd';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Sparkles, Youtube, Globe, DollarSign } from 'lucide-react';

export const metadata = buildMetadata({
  canonical: '/creator-economy/calculator',
  title: 'YouTube & Creator Earnings Calculator | Imperialpedia',
  description: 'Calculate your estimated YouTube ad revenue, website traffic income, and sponsorship earnings based on views, niche RPM rates, and audience geography.',
  keywords: ['YouTube Earnings Calculator', 'YouTube RPM Calculator', 'YouTube Monetization Calculator', 'AdSense Calculator', 'Website Traffic Income', 'Creator Earnings'],
});

export default function CreatorCalculatorPage() {
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'YouTube & Creator Earnings Calculator',
    url: 'https://imperialpedia.com/creator-economy/calculator',
    description: 'Calculate your estimated YouTube ad revenue, website traffic income, and sponsorship earnings based on views, niche RPM rates, and audience geography.',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <main className="min-h-screen bg-background pt-8 pb-24">
      <JsonLd data={jsonLdData} />
      <Container>
        <div className="mb-6">
          <Breadcrumbs
            breadcrumb={{
              items: [
                { name: 'Home', item: '/' },
                { name: 'Creator Economy', item: '/creator-economy' },
                { name: 'Earnings Calculator', item: '/creator-economy/calculator' },
              ],
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Creator Tool
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            YouTube & Creator Earnings Calculator
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Estimate your potential ad revenue, RPM payouts, and sponsorship income across YouTube, websites, and social media.
          </p>
        </div>

        <CreatorEarningsCalculator />

        {/* SEO Explainer Section */}
        <section className="mt-20 max-w-4xl mx-auto space-y-12 border-t border-gray-200 dark:border-gray-800 pt-12">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              How Creator Revenue Is Calculated
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Creator earnings vary significantly based on platform monetization models. On YouTube, creators receive income based on <strong>RPM (Revenue Per Mille)</strong>, which measures net revenue per 1,000 total video views after YouTube takes its 45% revenue split.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold">
                <Youtube className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground">YouTube RPM</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Niche advertiser demand drives RPM. Finance and software content can see $10–$25+ RPMs, while gaming and entertainment average $1.50–$4.00.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground">Audience Location</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Viewers in Tier 1 countries (US, UK, Canada, Australia) yield higher ad rates because advertisers spend more to acquire high-purchasing-power customers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground">Sponsorship Deals</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dedicated integrations generally pay a CPM of $20–$40 per 1,000 views, providing predictable revenue independent of YouTube’s algorithm.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 text-sm space-y-2">
            <h4 className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Important Financial Disclaimer
            </h4>
            <p className="text-blue-900/80 dark:text-blue-300/80 leading-relaxed text-xs">
              Calculated figures are estimates for planning purposes only and do not constitute guaranteed income or financial advice. Actual creator earnings depend on monetized view ratios, ad-blocker adoption, seasonality, and individual platform contracts.
            </p>
          </div>
        </section>
      </Container>
    </main>
  );
}
