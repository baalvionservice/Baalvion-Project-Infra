import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Server, 
  Zap, 
  Globe, 
  Lock, 
  Gauge, 
  DollarSign,
  Check,
  ArrowRight
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Blazing Fast",
    description: "Sub-10ms latency with direct datacenter connections",
  },
  {
    icon: DollarSign,
    title: "Cost Effective",
    description: "Most affordable proxy option for high-volume operations",
  },
  {
    icon: Server,
    title: "Unlimited Bandwidth",
    description: "Fixed pricing with no bandwidth limits or throttling",
  },
  {
    icon: Lock,
    title: "Dedicated IPs",
    description: "Exclusive IP addresses not shared with other users",
  },
  {
    icon: Gauge,
    title: "High Concurrency",
    description: "Handle thousands of concurrent connections effortlessly",
  },
  {
    icon: Globe,
    title: "Multiple Locations",
    description: "Datacenters in 50+ locations worldwide",
  },
];

const useCases = [
  "High-Volume Web Scraping",
  "Speed-Critical Operations",
  "API Testing & Development",
  "Load Testing & Benchmarking",
  "Bulk Data Collection",
  "Price Monitoring at Scale",
];

const datacenterLocations = [
  { city: "New York", country: "USA", latency: "8ms" },
  { city: "Los Angeles", country: "USA", latency: "12ms" },
  { city: "London", country: "UK", latency: "15ms" },
  { city: "Frankfurt", country: "Germany", latency: "10ms" },
  { city: "Tokyo", country: "Japan", latency: "18ms" },
  { city: "Singapore", country: "Singapore", latency: "20ms" },
  { city: "Sydney", country: "Australia", latency: "25ms" },
  { city: "São Paulo", country: "Brazil", latency: "22ms" },
];

const coverageData = [
  { region: "North America", locations: 15, ips: "500K+" },
  { region: "Europe", locations: 20, ips: "400K+" },
  { region: "Asia Pacific", locations: 12, ips: "300K+" },
  { region: "Latin America", locations: 5, ips: "100K+" },
  { region: "Middle East", locations: 3, ips: "50K+" },
  { region: "Africa", locations: 2, ips: "25K+" },
];

export default function DatacenterProxiesPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-chart-3/10 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              🖥️ Datacenter Proxies
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Lightning-Fast{" "}
              <span className="text-chart-3">Datacenter Proxies</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The fastest and most cost-effective proxy solution. Perfect for high-volume 
              operations that prioritize speed over stealth.
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
              Starting at $0.50/GB • Unlimited bandwidth plans available
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose Datacenter Proxies?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              When speed and cost matter most, datacenter proxies deliver unmatched performance.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-background/50 border-border/50 hover:border-chart-3/50 transition-colors">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-chart-3/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-chart-3" />
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
              <h2 className="text-3xl font-bold mb-6">Built for Speed & Scale</h2>
              <p className="text-muted-foreground mb-8">
                Datacenter proxies are ideal when you need raw performance and cost efficiency. 
                Perfect for non-stealth operations where speed is the priority.
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
            <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10 border-chart-3/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">Performance Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Avg Latency</span>
                    <span className="text-2xl font-bold text-chart-3">&lt;10ms</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="text-2xl font-bold">99.99%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">IP Pool</span>
                    <span className="text-2xl font-bold">1.4M+</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
                    <span className="text-muted-foreground">Locations</span>
                    <span className="text-2xl font-bold">50+</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Datacenter Locations */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Global Datacenter Network</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Strategically located datacenters for optimal routing and minimal latency.
            </p>
          </div>
          
          {/* Location cards */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {datacenterLocations.map((location) => (
                <Card key={location.city} className="bg-background/50">
                  <CardContent className="p-4 text-center">
                    <Server className="w-8 h-8 text-chart-3 mx-auto mb-2" />
                    <p className="font-semibold text-sm">{location.city}</p>
                    <p className="text-xs text-muted-foreground">{location.country}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {location.latency}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              + 42 more datacenter locations worldwide
            </p>
          </div>

          {/* Coverage Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {coverageData.map((region) => (
              <Card key={region.region} className="bg-background/50">
                <CardContent className="p-4 text-center">
                  <p className="font-semibold text-sm mb-1">{region.region}</p>
                  <p className="text-2xl font-bold text-chart-3">{region.ips}</p>
                  <p className="text-xs text-muted-foreground">{region.locations} locations</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Hint + CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-chart-3/10 via-chart-3/5 to-background border-chart-3/20">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Start with Datacenter Proxies</h2>
                <p className="text-muted-foreground mb-6">
                  The most affordable option for high-volume, speed-critical operations.
                </p>
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-chart-3">$0.50</p>
                    <p className="text-sm text-muted-foreground">per GB</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-chart-3">Unlimited</p>
                    <p className="text-sm text-muted-foreground">bandwidth options</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-chart-3">24/7</p>
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
