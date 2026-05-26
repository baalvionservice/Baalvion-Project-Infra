import HeroSection from '@/components/sections/hero-section';
import WhoWeAreSection from '@/components/sections/who-we-are-section';
import TrustSignals from '@/components/global/TrustSignals';
import QuarterlyResultsSection from '@/components/sections/quarterly-results-section';
import OverviewSection from '@/components/sections/overview-section';
import ThesisSection from '@/components/sections/thesis-section';
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
  'thesis': ThesisSection,
  'governance': GovernanceSection,
  'news': NewsSection,
  'press-releases': PressReleasesSection,
  'risk': RiskSection,
};
