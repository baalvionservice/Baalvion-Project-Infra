import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Smartphone, 
  Shield, 
  Zap, 
  Signal, 
  RefreshCw, 
  Lock,
  Check,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Smartphone,
    title: "Real 4G/5G Networks",
    description: "Genuine mobile carrier IPs from real devices worldwide",
  },
  {
    icon: Signal,
    title: "Carrier Diversity",
    description: "Access IPs from 700+ mobile carriers globally",
  },
  {
    icon: RefreshCw,
    title: "Automatic Rotation",
    description: "IP rotation on every request or custom intervals",
  },
  {
    icon: Shield,
    title: "Undetectable",
    description: "Appear as real mobile users to any target site",
  },
  {
    icon: Lock,
    title: "Dedicated Sessions",
    description: "Sticky sessions up to 30 minutes for complex workflows",
  },
  {
    icon: Zap,
    title: "Low Latency",
    description: "Optimized routing for minimum response times",
  },
];

const useCases = [
  "Mobile App Testing & QA",
  "Social Media Automation",
  "App Store Optimization",
  "Mobile Ad Verification",
  "Location-Based Testing",
  "Mobile-First Data Collection",
];

const carriers = [
  { name: "AT&T", country: "USA" },
  { name: "Verizon", country: "USA" },
  { name: "T-Mobile", country: "USA" },
  { name: "Vodafone", country: "UK" },
  { name: "O2", country: "UK" },
  { name: "Deutsche Telekom", country: "Germany" },
  { name: "Orange", country: "France" },
  { name: "NTT Docomo", country: "Japan" },
];

const coverageData = [
  { region: "North America", carriers: 45, ips: "8M+" },
  { region: "Europe", carriers: 120, ips: "12M+" },
  { region: "Asia Pacific", carriers: 200, ips: "15M+" },
  { region: "Latin America", carriers: 80, ips: "5M+" },
  { region: "Middle East", carriers: 40, ips: "3M+" },
  { region: "Africa", carriers: 60, ips: "2M+" },
];

export default function MobileProxiesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-chart-2/10 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              📱 Mobile Proxies
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Real Mobile IPs from{" "}
              <span className="text-chart-2">4G/5G Networks</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Access the internet through genuine mobile carrier connections. 
              Perfect for mobile-first testing, social media, and high-trust operations.
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
              Starting at $12/GB • Real carrier IPs only
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Premium Mobile Proxy Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade mobile proxy infrastructure with real carrier connections.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-background/50 border-border/50 hover:border-chart-2/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-chart-2/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-chart-2" />
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
              <h2 className="text-3xl font-bold mb-6">Perfect for Mobile-First Operations</h2>
              <p className="text-muted-foreground mb-8">
                Our mobile proxy network gives you access to real 4G/5G connections, 
                making your requests indistinguishable from genuine mobile users.
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
            <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10 border-chart-2/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Mobile Network Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Mobile Carriers</span>
                    <span className="text-2xl font-bold text-chart-2">700+</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Countries</span>
                    <span className="text-2xl font-bold">120+</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">IP Pool Size</span>
                    <span className="text-2xl font-bold">45M+</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Success Rate</span>
                    <span className="text-2xl font-bold text-success">98.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Carrier Coverage */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">700+ Mobile Carriers Worldwide</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Access real 4G/5G IPs from major carriers in every region.
            </p>
          </div>
          
          {/* Carrier logos/names */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {carriers.map((carrier) => (
                <Card key={carrier.name} className="bg-background/50">
                  <CardContent className="p-4 text-center">
                    <Smartphone className="w-8 h-8 text-chart-2 mx-auto mb-2" />
                    <p className="font-semibold text-sm">{carrier.name}</p>
                    <p className="text-xs text-muted-foreground">{carrier.country}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              + 690 more carriers across 120+ countries
            </p>
          </div>

          {/* Coverage Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {coverageData.map((region) => (
              <Card key={region.region} className="bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="font-semibold text-sm mb-1">{region.region}</p>
                  <p className="text-2xl font-bold text-chart-2">{region.ips}</p>
                  <p className="text-xs text-muted-foreground">{region.carriers} carriers</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Hint + CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-chart-2/10 via-chart-2/5 to-background border-chart-2/20">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Get Started with Mobile Proxies</h2>
                <p className="text-muted-foreground mb-6">
                  Real 4G/5G carrier IPs. Undetectable mobile fingerprints. Premium quality.
                </p>
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-chart-2">$12</p>
                    <p className="text-sm text-muted-foreground">per GB</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-chart-2">10GB</p>
                    <p className="text-sm text-muted-foreground">minimum</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-chart-2">24/7</p>
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
