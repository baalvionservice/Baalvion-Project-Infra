import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CompareSection from "@/components/CompareSection";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSection from "@/components/FeaturesSection";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import TeamSection from "@/components/TeamSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: 'ControlTheMarket — Hire by Skill, Not by Resume',
  description:
    'The proof-of-skill ecosystem where top companies discover verified talent based on real-world performance — not paper.',
  alternates: {
    canonical: absoluteUrl('/'),
  },
  openGraph: {
    url: absoluteUrl('/'),
    title: 'ControlTheMarket — Hire by Skill, Not by Resume',
    description:
      'The proof-of-skill ecosystem where top companies discover verified talent based on real-world performance — not paper.',
  },
};

// Adoption figures, customer names and hiring-outcome statistics were removed from this page: the
// company has no customers yet, so none of them were true. Marquee, TrustedBar, StatsSection and
// DataProof stay in components/ and can return when the numbers come from real data.
export default function Home() {
  return (
    <main>
      <Hero />
      <CompareSection />
      <HowItWorks />
      <FeaturesSection />
      <Testimonials />
      <Pricing />
      <TeamSection />
      <CTASection />
    </main>
  );
}
