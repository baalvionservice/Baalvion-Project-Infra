import HeroSection from '@/components/sections/hero-section';
import WhoWeAreSection from '@/components/sections/who-we-are-section';
import TrustSignals from '@/components/global/TrustSignals';
import QuarterlyResultsSection from '@/components/sections/quarterly-results-section';
import OverviewSection from '@/components/sections/overview-section';
import MarketOpportunitySection from '@/components/sections/market-opportunity-section';
import ThesisSection from '@/components/sections/thesis-section';
import PlatformSection from '@/components/sections/platform-section';
import BusinessModelSection from '@/components/sections/business-model-section';
import GovernanceSection from '@/components/sections/governance-section';
import NewsSection from '@/components/sections/news-section';
import PressReleasesSection from '@/components/sections/press-releases-section';
import RiskSection from '@/components/sections/risk-section';

// Institutional IR pages (see src/lib/ir-pages.ts for the page compositions).
import WhyInvestHeroSection from '@/components/sections/why-invest-hero';
import InvestmentHighlightsSection from '@/components/sections/investment-highlights';
import InvestorCtaSection from '@/components/sections/investor-cta';
import MarketDeepSection from '@/components/sections/market-deep';
import UseOfProceedsSection from '@/components/sections/use-of-proceeds';
import ThesisDetailSection from '@/components/sections/thesis-detail';
import CompanyStorySection from '@/components/sections/company-story';
import FinancialsSection from '@/components/sections/financials';
import KeyMetricsSection from '@/components/sections/key-metrics';
import GrowthStrategySection from '@/components/sections/growth-strategy';
import InvestorFaqSection from '@/components/sections/investor-faq';
import GovernanceFrameworkSection from '@/components/sections/governance-framework';
import InvestorResourcesSection from '@/components/sections/investor-resources';

export const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  'hero': HeroSection,
  'who-we-are': WhoWeAreSection,
  'trust-signals': TrustSignals,
  'quarterly-results': QuarterlyResultsSection,
  'overview': OverviewSection,
  'market-opportunity': MarketOpportunitySection,
  'thesis': ThesisSection,
  'platform': PlatformSection,
  'business-model': BusinessModelSection,
  'governance': GovernanceSection,
  'news': NewsSection,
  'press-releases': PressReleasesSection,
  'risk': RiskSection,

  // Institutional IR pages
  'why-invest-hero': WhyInvestHeroSection,
  'investment-highlights': InvestmentHighlightsSection,
  'investor-cta': InvestorCtaSection,
  'market-opportunity-deep': MarketDeepSection,
  'use-of-proceeds': UseOfProceedsSection,
  'thesis-detail': ThesisDetailSection,
  'company-story': CompanyStorySection,
  'financials': FinancialsSection,
  'key-metrics': KeyMetricsSection,
  'growth-strategy': GrowthStrategySection,
  'investor-faq': InvestorFaqSection,
  'governance-framework': GovernanceFrameworkSection,
  'investor-resources': InvestorResourcesSection,
};
