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
};
