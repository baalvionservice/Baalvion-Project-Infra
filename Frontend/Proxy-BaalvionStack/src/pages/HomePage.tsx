import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useRef, useState } from "react";
import { 
  ArrowRight, 
  Globe, 
  Smartphone, 
  Server, 
  Shield, 
  Zap, 
  BarChart3,
  Users,
  CheckCircle2,
  ArrowUpRight,
  Star,
  Quote
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/platformClient";
import { pricingPlans as fallbackPlans } from "@/data/mockData";

const features = [
  {
    icon: Globe,
    title: "195+ Countries",
    description: "Access residential IPs from any location worldwide with city-level targeting.",
  },
  {
    icon: Shield,
    title: "99.9% Uptime",
    description: "Enterprise-grade infrastructure with redundant systems and 24/7 monitoring.",
  },
  {
    icon: Zap,
    title: "Ultra-Fast",
    description: "Average latency under 50ms with optimized routing and premium bandwidth.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track usage, success rates, and performance with detailed dashboards.",
  },
  {
    icon: Users,
    title: "Team Management",
    description: "Create sub-users, assign limits, and manage access with granular controls.",
  },
  {
    icon: Server,
    title: "API-First",
    description: "RESTful API with SDKs for Python, Node.js, and more. Full automation support.",
  },
];

const proxyTypes = [
  {
    icon: Globe,
    title: "Residential Proxies",
    description: "Real residential IPs from ISPs worldwide. Perfect for web scraping and social media.",
    stats: "45M+ IPs",
    color: "primary",
    path: "/residential",
  },
  {
    icon: Smartphone,
    title: "Mobile Proxies",
    description: "4G/5G mobile IPs with carrier-level authenticity. Ideal for mobile app testing.",
    stats: "10M+ IPs",
    color: "accent",
    path: "/mobile",
  },
  {
    icon: Server,
    title: "Datacenter Proxies",
    description: "Lightning-fast datacenter IPs for high-volume operations and speed-critical tasks.",
    stats: "500K+ IPs",
    color: "warning",
    path: "/datacenter",
  },
];

const testimonials = [
  { name: "Sarah Chen", role: "CTO, DataFlow AI", text: "Baalvion reduced our scraping infrastructure costs by 60% while improving success rates to 99.2%. The API is exceptionally well-designed.", stars: 5 },
  { name: "Marcus Weber", role: "Head of Engineering, PriceTrack", text: "We migrated from 3 different proxy providers to Baalvion. The unified dashboard and team management alone saved us 20 hours/week.", stars: 5 },
  { name: "Anya Petrova", role: "VP Product, AdVerify Global", text: "The mobile proxy coverage is unmatched. We verify ads in 140+ countries with carrier-level authenticity. Enterprise support is world-class.", stars: 5 },
  { name: "James Okafor", role: "Founder, SEORank.io", text: "From zero to 50M daily requests in 3 months. Baalvion's infrastructure scaled seamlessly. The usage forecast feature prevented surprise bills.", stars: 5 },
];

const integrationLogos = [
  "Python", "Node.js", "Go", "Java", "Scrapy", "Selenium", "Puppeteer", "Playwright",
  "cURL", "Postman", "Zapier", "Make",
];

const animatedStats = [
  { label: "IPs Available", target: 45, suffix: "M+" },
  { label: "Countries", target: 195, suffix: "+" },
  { label: "Uptime", target: 99.9, suffix: "%" },
  { label: "Avg Latency", target: 48, suffix: "ms" },
];

function AnimatedCounter({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            setCount(target);
            clearInterval(timer);
          } else {
            setCount(Math.floor(current * 10) / 10);
          }
        }, duration / steps);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-bold text-primary">
        {Number.isInteger(target) ? Math.floor(count) : count.toFixed(1)}{suffix}
      </p>
    </div>
  );
}

export default function HomePage() {
  const { data: pricingPlans = fallbackPlans } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: () => publicApi.plans(),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <div className="relative">
      <SEOHead 
        title="Baalvion NetStack — Enterprise Proxy & Data Network" 
        description="Tier 1 residential, mobile and datacenter proxies with API-first SaaS. 45M+ IPs across 195+ countries. Built for creators, agencies and global enterprises."
        canonical="https://baalvion.com"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Baalvion NetStack",
          "url": "https://baalvion.com",
          "description": "Enterprise proxy and data network platform"
        }}
      />
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.02]" />
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(199 89% 48% / 0.15) 0%, transparent 50%)"
          }}
        />
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="info" className="mb-6 px-4 py-1.5">
              <Zap className="w-3 h-3 mr-1" />
              Enterprise-Grade Infrastructure
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
              <span className="text-foreground">Baalvion NetStack</span>
              <br />
              <span className="gradient-text">Enterprise Proxy & Data Network</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Tier 1 residential, mobile and datacenter proxies with API-first SaaS, 
              built for creators, agencies and global enterprises.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/docs">
                  View Documentation
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>99.9% Uptime SLA</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>45M+ Residential IPs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proxy Types Section */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Proxy Type
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Select from our range of premium proxy solutions tailored to your specific use case.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {proxyTypes.map((type) => (
              <Card key={type.title} variant="interactive" className="group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                    <type.icon className="w-7 h-7 text-primary" />
                  </div>
                  <Badge variant="muted" className="mb-4">{type.stats}</Badge>
                  <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                  <p className="text-muted-foreground mb-6">{type.description}</p>
                  <Link 
                    to={type.path}
                    className="inline-flex items-center text-primary font-medium hover:gap-2 transition-all"
                  >
                    Learn More <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Scale
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to power your data collection at enterprise scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} variant="glass" className="group hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No hidden fees. Pay only for what you use. Scale up or down anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                variant={plan.popular ? "glow" : "default"}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground mb-6">{plan.bandwidth} bandwidth</p>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.popular ? "hero" : "outline"} 
                    className="w-full"
                    asChild
                  >
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/pricing" className="text-primary hover:underline">
              View all pricing options →
            </Link>
          </div>
        </div>
      </section>

      {/* Animated Stats Counter */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {animatedStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">See what our customers say about Baalvion NetStack.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <Card key={i} variant="glass" className="group hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-primary/20 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: t.stars }).map((_, j) => (
                        <Star key={j} className="w-3.5 h-3.5 text-warning fill-warning" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Logos */}
      <section className="py-16 border-t border-border bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">Works With Your Stack</h2>
            <p className="text-sm text-muted-foreground">Native SDKs, plugins, and integrations for every major platform.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-3xl mx-auto">
            {integrationLogos.map((name) => (
              <div key={name} className="px-5 py-2.5 rounded-lg bg-secondary/40 border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-4">
          <Card variant="glow" className="max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-12 text-center relative">
              <div 
                className="absolute inset-0 opacity-50"
                style={{
                  background: "radial-gradient(ellipse at center, hsl(199 89% 48% / 0.1) 0%, transparent 70%)"
                }}
              />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  Join thousands of businesses using Baalvion NetStack to power their data operations.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/signup">
                      Start Free Trial
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/contact">Contact Sales</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
