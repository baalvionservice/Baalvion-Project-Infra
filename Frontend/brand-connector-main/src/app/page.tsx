'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Rocket,
  ShieldCheck,
  Zap,
  ArrowRight,
  BarChart3,
  Star,
  Users,
  Cpu,
  UserCheck,
  Globe,
  Twitter,
  Linkedin,
  Instagram,
  Facebook,
  Github
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ParticlesBackground } from '@/components/landing/ParticlesBackground';
import { StatsBanner } from '@/components/landing/StatsBanner';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { MatchingDemo } from '@/components/landing/MatchingDemo';
import { Pricing } from '@/components/landing/Pricing';
import { Testimonials } from '@/components/landing/Testimonials';
import { CreatorShowcase } from '@/components/landing/CreatorShowcase';
import { ActiveCampaigns } from '@/components/landing/ActiveCampaigns';
import { FAQ } from '@/components/landing/FAQ';

export default function LandingPage() {
  const features = [
    {
      title: "AI Matching Engine",
      desc: "Our proprietary algorithm finds the perfect creators for your specific brand objectives and audience demographics.",
      icon: Cpu,
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Escrow Payments",
      desc: "Funds are held in escrow and released only when deliverables are approved. Total security for both parties.",
      icon: ShieldCheck,
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Deep Analytics",
      desc: "Track ROI, engagement rates, and campaign performance in real-time with deep data integration and reporting.",
      icon: BarChart3,
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Creator Verification",
      desc: "We vet every creator to ensure a high-quality community of real people with verified performance statistics.",
      icon: UserCheck,
      color: "bg-orange-100 text-orange-600"
    },
    {
      title: "Multi-Currency",
      desc: "Support for global campaigns with automatic currency conversion and localized payment methods worldwide.",
      icon: Globe,
      color: "bg-indigo-100 text-indigo-600"
    },
    {
      title: "Community Hub",
      desc: "Connect with other creators and brands in our exclusive forum to share insights and marketing best practices.",
      icon: Users,
      color: "bg-yellow-100 text-yellow-600"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      

      <main className="flex-1" id="main-content">
        {/* Hero Section */}
        <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-[#4c1d95] via-[#312e81] to-[#1e1b4b] text-white py-12 lg:py-0">
          <ParticlesBackground />
          <div className="container px-4 md:px-6 relative z-10 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="flex flex-col space-y-8"
              >
                <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold border border-white/20 backdrop-blur-sm w-fit">
                  <Zap className="h-4 w-4 mr-2 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                  AI-Powered Market Insights
                </div>
                <h1 className="text-4xl font-headline font-extrabold tracking-tighter sm:text-6xl xl:text-7xl/none">
                  Connect Brands with <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-200">
                    Creators Who Deliver
                  </span>
                </h1>
                <p className="max-w-[600px] text-indigo-100/80 md:text-xl font-light leading-relaxed">
                  The data-driven marketplace where performance meets creativity.
                  Skip the guesswork and start building campaigns that actually convert.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/signup/brand">
                    <Button size="lg" className="w-full sm:w-auto rounded-full px-8 h-14 text-lg bg-white text-indigo-900 hover:bg-indigo-50">
                      Start as Brand <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                    </Button>
                  </Link>
                  <Link href="/auth/signup/creator">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 h-14 text-lg border-white/30 bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                      Join as Creator
                    </Button>
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="relative z-20 rounded-2xl border border-white/20 bg-white/5 p-4 backdrop-blur-md shadow-2xl">
                  <div className="aspect-[16/10] relative rounded-xl overflow-hidden border border-white/10">
                    <Image
                      src="https://picsum.photos/seed/baalvion-dashboard/1000/625"
                      alt="Baalvion Dashboard UI showing creator performance and campaign analytics"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-primary/20 blur-[100px] -z-10 rounded-full" aria-hidden="true" />
              </motion.div>
            </div>
          </div>
        </section>


          <StatsBanner />
          <HowItWorks />
          <MatchingDemo />
          <ActiveCampaigns />
          <CreatorShowcase />

        <section id="features" className="w-full py-24 bg-slate-50">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-headline font-bold tracking-tighter md:text-5xl text-slate-900">Everything You Need to Scale</h2>
              <p className="max-w-[900px] text-muted-foreground mt-4 md:text-xl/relaxed">
                Powerful tools built for both sides of the marketplace, powered by advanced matching algorithms.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, i) => (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-background p-8 rounded-2xl border transition-all hover:shadow-xl flex flex-col"
                >
                  <div className={`mb-6 w-14 h-14 flex items-center justify-center rounded-2xl ${feature.color}`} aria-hidden="true">
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-headline font-bold mb-3 text-slate-900">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 flex-1">{feature.desc}</p>
                  <Link href="#" className="inline-flex items-center text-sm font-bold text-primary hover:underline group">
                    Learn More <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />
        <Pricing />
        <FAQ />

        {/* CTA Section */}
        <section className="w-full py-24 bg-white overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-indigo-600 to-indigo-900 px-8 py-20 text-center shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-50" aria-hidden="true" />
              <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary-foreground/10 rounded-full blur-3xl opacity-50" aria-hidden="true" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-3xl font-headline font-bold tracking-tighter text-white md:text-5xl lg:text-6xl">
                  Ready to grow your brand or income?
                </h2>
                <p className="text-indigo-100/90 md:text-xl font-light leading-relaxed">
                  Join 10,000+ creators and 1,500+ brands already scaling their success on Baalvion Connect. Our AI matching engine is waiting for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                  <Link href="/auth/signup/brand">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto rounded-full px-10 font-bold text-lg h-16 shadow-xl hover:scale-105 transition-transform bg-white text-primary">
                      Start as Brand
                    </Button>
                  </Link>
                  <Link href="/auth/signup/creator">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-10 bg-transparent text-white border-white/30 hover:bg-white/10 h-16 text-lg hover:scale-105 transition-transform">
                      Join as Creator
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      
    </div>
  );
}
