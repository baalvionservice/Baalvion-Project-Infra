import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Globe, 
  Shield, 
  Zap, 
  MapPin, 
  Users, 
  BarChart3,
  Check,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "195+ Countries",
    description: "Access residential IPs from virtually every country worldwide",
  },
  {
    icon: Shield,
    title: "99.9% Uptime",
    description: "Enterprise-grade reliability with automatic failover",
  },
  {
    icon: Zap,
    title: "Ultra-Fast Speeds",
    description: "Average latency under 50ms for seamless operations",
  },
  {
    icon: Users,
    title: "72M+ IP Pool",
    description: "Massive pool of ethically-sourced residential IPs",
  },
  {
    icon: MapPin,
    title: "City-Level Targeting",
    description: "Precise geo-targeting down to city and ASN level",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Monitor usage, success rates, and performance live",
  },
];

const useCases = [
  "Web Scraping & Data Collection",
  "Ad Verification & Brand Protection",
  "Price Comparison & Market Research",
  "SEO Monitoring & SERP Tracking",
  "Social Media Management",
  "E-commerce Intelligence",
];

const coverageData = [
  { region: "North America", countries: 3, ips: "18M+" },
  { region: "Europe", countries: 45, ips: "22M+" },
  { region: "Asia Pacific", countries: 35, ips: "15M+" },
  { region: "Latin America", countries: 20, ips: "8M+" },
  { region: "Middle East", countries: 15, ips: "5M+" },
  { region: "Africa", countries: 40, ips: "4M+" },
];

export default function ResidentialProxiesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              🏠 Residential Proxies
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Real Residential IPs for{" "}
              <span className="text-primary">Undetectable Access</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Access the web through genuine residential IP addresses. Perfect for web scraping, 
              ad verification, and data collection at scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Starting at $4.50/GB • No commitment required
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Our Residential Proxies?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade infrastructure designed for reliability, speed, and scale.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-background/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for Your Use Case</h2>
              <p className="text-muted-foreground mb-8">
                Our residential proxy network is optimized for a wide range of business applications, 
                from simple data collection to complex multi-threaded operations.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {useCases.map((useCase) => (
                  <div key={useCase} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-sm">{useCase}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Performance Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="text-2xl font-bold text-success">99.2%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Avg Response Time</span>
                    <span className="text-2xl font-bold">42ms</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">IP Pool Size</span>
                    <span className="text-2xl font-bold">72M+</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Countries</span>
                    <span className="text-2xl font-bold">195+</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Coverage Map */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Global Coverage</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Access residential IPs from every major region with city-level targeting.
            </p>
          </div>
          
          {/* Mock World Map */}
          <div className="relative max-w-4xl mx-auto mb-12">
            <div className="aspect-[2/1] bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-2xl border border-border/50 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <svg viewBox="0 0 800 400" className="w-full h-full">
                  {/* Simplified world map paths */}
                  <ellipse cx="400" cy="200" rx="350" ry="150" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/30" />
                  <circle cx="200" cy="150" r="40" fill="currentColor" className="text-primary/20" />
                  <circle cx="450" cy="120" r="50" fill="currentColor" className="text-primary/20" />
                  <circle cx="600" cy="180" r="35" fill="currentColor" className="text-primary/20" />
                  <circle cx="350" cy="250" r="25" fill="currentColor" className="text-primary/20" />
                  <circle cx="500" cy="280" r="30" fill="currentColor" className="text-primary/20" />
                </svg>
              </div>
              {/* Animated dots representing proxy locations */}
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-primary rounded-full animate-pulse"
                    style={{
                      left: `${15 + Math.random() * 70}%`,
                      top: `${20 + Math.random() * 60}%`,
                      animationDelay: `${Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>
              <div className="relative z-10 text-center">
                <Globe className="w-16 h-16 text-primary mx-auto mb-4" />
                <p className="text-lg font-semibold">195+ Countries Covered</p>
                <p className="text-sm text-muted-foreground">72M+ Residential IPs</p>
              </div>
            </div>
          </div>

          {/* Coverage Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {coverageData.map((region) => (
              <Card key={region.region} className="bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="font-semibold text-sm mb-1">{region.region}</p>
                  <p className="text-2xl font-bold text-primary">{region.ips}</p>
                  <p className="text-xs text-muted-foreground">{region.countries} countries</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Hint + CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Start Using Residential Proxies Today</h2>
                <p className="text-muted-foreground mb-6">
                  No long-term commitments. Pay only for what you use. Cancel anytime.
                </p>
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">$4.50</p>
                    <p className="text-sm text-muted-foreground">per GB</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">50GB</p>
                    <p className="text-sm text-muted-foreground">minimum</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">24/7</p>
                    <p className="text-sm text-muted-foreground">support</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <Link to="/signup">
                      Start Free Trial
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
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
