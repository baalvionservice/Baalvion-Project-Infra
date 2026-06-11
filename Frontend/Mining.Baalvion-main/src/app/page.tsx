import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Truck, BarChart3, ArrowRight, Briefcase, Gem, Zap, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { BRAND_IMAGES } from "@/lib/brand-assets";
import { JsonLd } from "@/components/seo/JsonLd";

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-trading');

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Baalvion Mining Inc.",
    "url": "https://mining.baalvion.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://mining.baalvion.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <JsonLd data={websiteSchema} />
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-32 overflow-hidden bg-primary text-primary-foreground">
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary ring-1 ring-inset ring-secondary/20">
                  <Zap className="mr-2 h-4 w-4" />
                  Real-time Global Market Intelligence
                </div>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-bold leading-[1.1] tracking-tighter">
                  The Global Standard for <span className="text-secondary italic">Mineral Trading</span>
                </h1>
                <p className="text-lg md:text-xl text-primary-foreground/80 max-w-xl leading-relaxed">
                  Baalvion Mining Inc. simplifies complex B2B mineral transactions with AI-powered compliance, integrated logistics, and secure global supply chains.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Link href="/register" className="w-full sm:w-auto">
                    <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full px-8 py-7 text-lg font-bold shadow-xl shadow-secondary/20">
                      Get Started Today
                    </Button>
                  </Link>
                  <Link href="/marketplace" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 w-full px-8 py-7 text-lg font-bold">
                      Browse Marketplace
                    </Button>
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-secondary" />
                    <span className="text-xs font-bold text-primary-foreground/80 uppercase tracking-wider">KYC &amp; Compliance-First</span>
                  </div>
                  <div className="h-6 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-secondary" />
                    <span className="text-xs font-bold text-primary-foreground/80 uppercase tracking-wider">Secure Escrow Settlement</span>
                  </div>
                  <div className="h-6 w-px bg-white/10 hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-secondary" />
                    <span className="text-xs font-bold text-primary-foreground/80 uppercase tracking-wider">Registered in India · CIN U43121OD2025PTC048479</span>
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="absolute -inset-4 rounded-3xl bg-secondary/20 blur-3xl" />
                <div className="relative rounded-[2.5rem] overflow-hidden border-8 border-white/5 shadow-2xl shadow-black/50 aspect-[4/3]">
                  <Image 
                    src={heroImage?.imageUrl || BRAND_IMAGES.hero}
                    alt="Baalvion Mining Inc. Platform Interface - Global Industrial Network" 
                    fill 
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    data-ai-hint="mineral trading"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-background">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-20 max-w-3xl mx-auto">
              <Badge variant="outline" className="text-primary border-primary/20 uppercase font-black tracking-widest text-[10px] px-4">Core Capabilities</Badge>
              <h2 className="text-3xl md:text-5xl font-headline font-bold text-primary tracking-tight">One Network. Endless Supply.</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Baalvion Mining Inc. provides a comprehensive trade ecosystem designed for industrial reliability and regulatory compliance.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <ShieldCheck className="h-8 w-8 text-secondary" />,
                  title: "AI Compliance",
                  desc: "Automated verification of mining licenses and export permits using deep neural scanning."
                },
                {
                  icon: <Briefcase className="h-8 w-8 text-secondary" />,
                  title: "RFQ Terminal",
                  desc: "Efficient bidding and quotation process for large-scale industrial mineral supply agreements."
                },
                {
                  icon: <Truck className="h-8 w-8 text-secondary" />,
                  title: "Logistics Hub",
                  desc: "Real-time vessel and fleet tracking for complex cross-border sea and land transport."
                },
                {
                  icon: <BarChart3 className="h-8 w-8 text-secondary" />,
                  title: "Market Intel",
                  desc: "AI-driven demand forecasting and regional price index benchmarks for global commodities."
                }
              ].map((feature, i) => (
                <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 bg-white group cursor-default">
                  <CardContent className="pt-10 p-8 text-center space-y-4">
                    <div className="inline-flex p-4 rounded-2xl bg-primary/5 mb-2 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                      <div className="group-hover:text-secondary">
                        {feature.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-primary">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Global Reach Section */}
        <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#21CEDD_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10">
                <Image src={BRAND_IMAGES.globalNetwork} alt="Baalvion Mining global logistics and supply network" fill loading="lazy" className="object-cover" />
              </div>
              <div className="space-y-8">
                <h2 className="text-3xl md:text-5xl font-headline font-bold italic tracking-tighter uppercase leading-none">
                  Global Export <br /> <span className="text-secondary">Mastery</span>
                </h2>
                <p className="text-lg text-slate-400 leading-relaxed">
                  Headquartered in Mumbai with strategic operations in Odisha and international trade hubs, we bridge the gap between extraction and industrial consumption.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <Gem className="h-6 w-6 text-secondary mb-3" />
                    <p className="text-base font-bold text-white leading-tight">Bulk &amp; Industrial Minerals</p>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Ferrous · Base · Critical</p>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <ShieldCheck className="h-6 w-6 text-secondary mb-3" />
                    <p className="text-base font-bold text-white leading-tight">Verified Supply Chains</p>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Compliance-led trade</p>
                  </div>
                </div>
                <Link href="/solutions">
                  <Button variant="outline" size="lg" className="h-14 border-white/20 text-white hover:bg-white/10 hover:text-white px-8 font-bold gap-2">
                    View Trade Solutions <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
