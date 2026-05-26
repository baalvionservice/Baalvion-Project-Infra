"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Globe,
  Gem,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Building2,
  HelpCircle,
  Briefcase,
  Zap,
  ChevronRight,
  ShoppingBag,
  Truck,
  Scale,
  Target,
  Users,
  Anchor,
} from "lucide-react";
import {
  PseoPageData,
  getVariatedIntro,
  miningProducts,
  tradeLocations,
} from "@/lib/pseo-data";
import Link from "next/link";
import { RelatedProducts } from "@/components/marketplace/RelatedProducts";
import { cn } from "@/lib/utils";

interface PseoTemplateProps {
  data: PseoPageData;
}

export function PseoTemplate({ data }: PseoTemplateProps) {
  const {
    productName,
    location,
    role,
    category,
    supplierCount,
    avgPurity,
    industry,
    intent,
    priceRange,
  } = data;
  const introText = getVariatedIntro(data);

  // High-Density SEO Structured Data
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Who are the top ${productName} ${role} in ${location}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `GeoTrade Nexus features ${supplierCount} verified ${productName} ${role} in ${location}, all of whom have passed Tier 2 KYC verification and maintain industrial-grade standards.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the average purity of ${productName} from ${location}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Industrial material from this region typically maintains a benchmark grade of ${avgPurity}, highly suitable for ${industry} applications.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the typical lead time for ${productName} export?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Export lead times for ${productName} from ${location} ports vary based on vessel availability, usually ranging from 14 to 28 days for bulk shipments.`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={faqData} />
      <Navbar />

      <div className="bg-white border-b py-10">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto space-y-6">
          <Breadcrumbs
            items={[
              { label: "Marketplace", href: "/marketplace" },
              {
                label: `${productName} in ${location}`,
                href: `/trade/${data.slug}`,
              },
            ]}
          />
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-primary text-white font-bold px-3 py-1 uppercase tracking-widest text-[10px] rounded-sm"
                >
                  {intent.replace("_", " ")}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 uppercase tracking-widest text-[10px] rounded-sm"
                >
                  <ShieldCheck className="h-3 w-3 mr-1" /> Tier 3 Verified
                </Badge>
              </div>
              <h1 className="text-4xl md:text-6xl font-headline font-bold text-slate-900 leading-tight tracking-tight">
                {intent === "BUY"
                  ? `Where to Buy ${productName} in ${location}`
                  : `${productName} ${role} in ${location}`}
              </h1>
              <div className="flex items-center gap-6 text-sm text-slate-500 font-medium pt-2">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-primary" /> {location} Trade
                  Region
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary" /> {supplierCount}{" "}
                  Verified Entities
                </span>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href="/register" className="flex-1 lg:flex-none">
                <Button className="w-full bg-primary text-white font-bold h-14 px-10 shadow-xl group rounded-2xl">
                  {intent === "BUY"
                    ? "Initiate Procurement"
                    : "Access Directory"}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-16 flex-1">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-16">
            {/* Global Analysis Card */}
            <section className="space-y-8">
              <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                <CardHeader className="bg-slate-900 text-white p-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-2">
                        Market Intelligence
                      </p>
                      <CardTitle className="text-3xl font-headline font-bold italic tracking-tighter">
                        Trade Corridor Analysis
                      </CardTitle>
                    </div>
                    <Zap className="h-10 w-10 text-secondary opacity-20" />
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-8">
                  <p className="text-xl text-slate-600 leading-relaxed font-medium border-l-4 border-secondary pl-8">
                    {introText}
                  </p>
                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Avg. Grade
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {avgPurity}
                      </p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Region Price
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {priceRange || "Spot Index"}
                      </p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Availability
                      </p>
                      <p className="text-2xl font-bold text-emerald-600">
                        High
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Industrial Applications Grid */}
            <section className="space-y-8">
              <h2 className="text-3xl font-headline font-bold text-slate-900 uppercase italic tracking-tighter">
                Industry <span className="text-primary">Engagement</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border space-y-6 group hover:border-primary/20 transition-all">
                  <div className="h-14 w-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Briefcase className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      {industry} Sector Integration
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Material from the {location} trade hub is engineered for
                      high-precision {industry} requirements. Verified $
                      {role.toLowerCase()} maintain specialized storage
                      protocols to preserve ${avgPurity} purity during long-term
                      procurement cycles.
                    </p>
                  </div>
                </div>
                <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border space-y-6 group hover:border-secondary/20 transition-all">
                  <div className="h-14 w-14 bg-secondary/5 rounded-2xl flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition-all">
                    <Target className="h-7 w-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">
                      Efficiency Benchmarking
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Connect with the top {supplierCount} {role.toLowerCase()}{" "}
                      in {location}. Our automated matching engine identifies
                      suppliers with the highest fulfillment accuracy for bulk{" "}
                      {productName} orders, significantly reducing industrial
                      downtime.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Compliance & Quality Section */}
            <section className="grid sm:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden rounded-[2.5rem]">
                <CardHeader className="border-b border-white/10 p-8">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <Scale className="h-5 w-5 text-secondary" /> Purity
                    Enforcement
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-sm text-slate-400 leading-relaxed">
                    To maintain the {avgPurity} integrity, all trade records are
                    secured via milestone-based escrow. Material release is only
                    authorized after technical verification from certified
                    third-party inspectors (SGS/Bureau Veritas).
                  </p>
                  <div className="flex gap-4">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold">
                      Verified Lab Audit
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold">
                      Escrow Shield
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2.5rem] border border-slate-100">
                <CardHeader className="bg-slate-50/50 border-b p-8">
                  <CardTitle className="text-lg flex items-center gap-3">
                    <Truck className="h-5 w-5 text-primary" /> Corridor
                    Logistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Transit protocols for {productName} in {location} utilize
                    integrated sea-freight tracking. Every bulk order includes
                    automated customs filing and IoT-monitored material transit
                    to ensure delivery within the 28-day window.
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary font-bold text-xs uppercase tracking-widest gap-2 group"
                  >
                    Analyze Logistics Route{" "}
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </section>

            {/* FAQ Accordion */}
            <section className="space-y-8">
              <h2 className="text-3xl font-headline font-bold text-slate-900 uppercase italic tracking-tighter border-l-8 border-primary pl-6">
                Market <span className="text-primary">Intelligence</span>
              </h2>
              <div className="grid gap-4">
                {[
                  {
                    q: `What are the bulk pricing trends for ${productName}?`,
                    a: `Pricing for ${productName} in the ${location} region is currently ${
                      priceRange
                        ? `benchmarked at ${priceRange}`
                        : "benchmarked against the global spot index"
                    }. Significant volume discounts are available for enterprise supply contracts exceeding 10,000 MT.`,
                  },
                  {
                    q: `How do I verify the technical grade of ${productName}?`,
                    a: `Technical grade verification for ${productName} involves a mandatory lab inspection report (CoA) confirming ${avgPurity} grade before escrow release. These documents are stored on an immutable ledger for audit transparency.`,
                  },
                  {
                    q: `Which ${role.toLowerCase()} are Tier 3 verified?`,
                    a: `GeoTrade Nexus lists ${supplierCount} ${role.toLowerCase()} in ${location} who have passed the Tier 3 industrial audit, including mining license boundary verification and on-site purity testing.`,
                  },
                ].map((faq, i) => (
                  <Card
                    key={i}
                    className="border-none shadow-sm group hover:border-primary/20 transition-all rounded-3xl"
                  >
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-lg font-bold flex items-start gap-4 text-slate-900 group-hover:text-primary transition-colors leading-tight">
                        <HelpCircle className="h-6 w-6 text-secondary shrink-0" />
                        {faq.q}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {faq.a}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <RelatedProducts currentProductId={data.slug} />
          </div>

          {/* Sidebar / Hub Navigation */}
          <aside className="space-y-8">
            <Card className="border-none shadow-2xl bg-primary text-primary-foreground overflow-hidden rounded-[2.5rem] relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp className="h-48 w-48" />
              </div>
              <CardContent className="p-10 space-y-8 relative z-10">
                <h3 className="text-2xl font-headline font-bold italic tracking-tight uppercase">
                  Sourcing Hub
                </h3>
                <p className="text-sm text-primary-foreground/70 leading-relaxed font-medium">
                  Connect with {supplierCount} verified ${productName} $
                  {role.toLowerCase()} in {location}. Secure your industrial
                  supply chain with factory-direct pricing and verified
                  technical grades.
                </p>
                <Link href="/register" className="block">
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black uppercase text-xs h-14 shadow-lg group italic rounded-2xl">
                    Initialize Trade Order{" "}
                    <ShoppingBag className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Trade Corridor Matrix (Min 12 Links) */}
            <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white">
              <CardHeader className="bg-slate-50/50 border-b p-8">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Trade Corridor Matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {[
                    {
                      title: `Top ${productName} Suppliers`,
                      href: "/marketplace",
                    },
                    {
                      title: `Verified ${location} Exporters`,
                      href: "/directory",
                    },
                    {
                      title: `${productName} Global Producers`,
                      href: "/directory",
                    },
                    { title: `${industry} Supply Chain`, href: "/guides" },
                    {
                      title: `All ${category} Commodities`,
                      href: "/marketplace",
                    },
                    {
                      title: `${productName} Price Index`,
                      href: "/dashboard/market/prices",
                    },
                    {
                      title: `Export Compliance: ${location}`,
                      href: "/guides",
                    },
                    { title: `Regional Logistics Hub`, href: "/logistics" },
                    { title: `Sustainability in ${category}`, href: "/guides" },
                    {
                      title: `Open ${productName} RFQs`,
                      href: "/dashboard/rfq",
                    },
                    { title: `Global Trade Standards`, href: "/guides" },
                    { title: `Tier 3 Verification Guide`, href: "/help" },
                  ].map((link, i) => (
                    <Link
                      key={i}
                      href={link.href}
                      className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-xs font-bold text-slate-700 group-hover:text-primary">
                        {link.title}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                <ShieldCheck className="h-4 w-4" /> Trusted Network
              </div>
              <p className="text-[11px] text-emerald-600 leading-relaxed font-medium">
                Every trade record for {productName} in the {location} region is
                verified via authorized third-party lab audits, ensuring 100%
                technical grade transparency for global buyers.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
