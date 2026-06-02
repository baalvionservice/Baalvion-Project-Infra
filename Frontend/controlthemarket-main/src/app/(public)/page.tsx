import type { Metadata } from 'next';
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import TrustedBar from "@/components/TrustedBar";
import StatsSection from "@/components/StatsSection";
import DataProof from "@/components/DataProof";
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
    'The proof-of-skill ecosystem where top companies discover verified talent based on real-world performance — not paper. Start your free 14-day trial today.',
  alternates: {
    canonical: 'https://controlthemarket.com',
  },
  openGraph: {
    url: 'https://controlthemarket.com',
    title: 'ControlTheMarket — Hire by Skill, Not by Resume',
    description:
      'The proof-of-skill ecosystem where top companies discover verified talent based on real-world performance — not paper.',
  },
};

export default function Home() {
  return (
    <main>
      <Hero />
      <Marquee />
      <TrustedBar />
      <StatsSection />
      <DataProof />
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
