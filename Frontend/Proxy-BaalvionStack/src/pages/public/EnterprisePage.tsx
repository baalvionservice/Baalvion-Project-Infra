import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import {
  Shield, Zap, Users, Globe, Lock, BarChart3, Check, ArrowRight,
  Building2, HeadphonesIcon, FileText, Scale, Crown, Clock
} from "lucide-react";

const features = [
  { icon: Globe, title: "Unlimited Scale", desc: "No bandwidth caps. No throttling. Scale to millions of requests per day." },
  { icon: Shield, title: "99.99% SLA", desc: "Guaranteed uptime with 10x service credits and dedicated infrastructure." },
  { icon: Users, title: "Dedicated Account Manager", desc: "A named technical account manager who knows your infrastructure." },
  { icon: Lock, title: "Security Review", desc: "SOC 2 Type II certified. Custom security reviews and penetration test reports." },
  { icon: BarChart3, title: "Custom Analytics", desc: "White-label dashboards, custom reporting, and data warehouse integrations." },
  { icon: Scale, title: "Flexible Contracts", desc: "Monthly, annual, or multi-year terms. Custom SLAs and payment schedules." },
];

const caseStudies = [
  { company: "Fortune 500 Retailer", metric: "4.2M", label: "daily price checks", quote: "Baalvion's enterprise infrastructure handles our peak Black Friday traffic without breaking a sweat." },
  { company: "Top 10 SEO Platform", metric: "99.7%", label: "success rate", quote: "We switched from 3 providers to Baalvion and our success rates improved across the board." },
  { company: "Global Ad Verification", metric: "67%", label: "cost reduction", quote: "Enterprise pricing and dedicated routing cut our proxy spend by two-thirds." },
];

const volumePricing = [
  { tier: "100 GB – 500 GB", residential: "$4.00/GB", mobile: "$10.00/GB", datacenter: "$0.90/GB" },
  { tier: "500 GB – 2 TB", residential: "$3.20/GB", mobile: "$8.00/GB", datacenter: "$0.70/GB" },
  { tier: "2 TB – 10 TB", residential: "$2.50/GB", mobile: "$6.50/GB", datacenter: "$0.50/GB" },
  { tier: "10 TB+", residential: "Custom", mobile: "Custom", datacenter: "Custom" },
];

export default function EnterprisePage() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Enterprise Proxy Solutions"
        description="Enterprise-grade proxy infrastructure with 99.99% SLA, dedicated account management, custom integrations, and volume pricing. Built for Fortune 500."
        canonical="https://baalvion.com/enterprise"
      />

      {/* Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 gap-1"><Crown className="w-3 h-3" /> Enterprise</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Proxy Infrastructure Built for{" "}
              <span className="gradient-text">Enterprise Scale</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Dedicated infrastructure, custom SLAs, volume pricing, and white-glove support for organizations that demand the best.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="hero" asChild>
                <Link to="/book-demo">Book a Demo <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Enterprise-Only Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Trusted by Industry Leaders</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((cs) => (
              <Card key={cs.company} className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-primary">{cs.metric}</p>
                    <p className="text-sm text-muted-foreground">{cs.label}</p>
                  </div>
                  <p className="text-sm text-muted-foreground italic mb-4">"{cs.quote}"</p>
                  <p className="text-sm font-semibold">{cs.company}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Volume Pricing */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-4">Volume Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">The more you use, the less you pay. Custom pricing for 10TB+.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-semibold">Volume Tier</th>
                  <th className="text-center p-4 font-semibold">Residential</th>
                  <th className="text-center p-4 font-semibold">Mobile</th>
                  <th className="text-center p-4 font-semibold">Datacenter</th>
                </tr>
              </thead>
              <tbody>
                {volumePricing.map((row) => (
                  <tr key={row.tier} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-4 font-medium">{row.tier}</td>
                    <td className="p-4 text-center">{row.residential}</td>
                    <td className="p-4 text-center">{row.mobile}</td>
                    <td className="p-4 text-center">{row.datacenter}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Security Review */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Security-First Architecture</h2>
              <p className="text-muted-foreground mb-6">Our enterprise platform meets the strictest compliance standards.</p>
              <div className="space-y-3">
                {["SOC 2 Type II Certified", "ISO 27001 Certified", "GDPR & CCPA Compliant", "PCI DSS Level 1", "Annual Penetration Testing", "Custom Security Reviews Available"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "SOC 2", icon: Shield },
                { name: "ISO 27001", icon: Lock },
                { name: "GDPR", icon: FileText },
                { name: "PCI DSS", icon: Scale },
              ].map((cert) => (
                <Card key={cert.name} className="text-center">
                  <CardContent className="p-6">
                    <cert.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="font-semibold text-sm">{cert.name}</p>
                    <Badge variant="default" className="mt-2 text-xs">Certified</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="p-8 md:p-12 text-center">
              <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Ready to Scale?</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Talk to our enterprise team about custom infrastructure, volume pricing, and dedicated support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="hero" asChild>
                  <Link to="/book-demo">Book a Demo <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/contact">Contact Sales</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}