import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, ArrowRight, Globe, Smartphone, Server } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";

const proxyTypes = [
  {
    name: "Residential",
    icon: Globe,
    description: "Real IPs from ISP networks worldwide",
    recommended: "Web scraping, market research, ad verification",
    plan: "Professional",
    features: {
      "Real ISP IPs": true,
      "Geo-targeting (Country)": true,
      "Geo-targeting (City)": true,
      "Sticky Sessions": true,
      "Rotating IPs": true,
      "High Anonymity": true,
      "SOCKS5 Support": true,
      "Mobile Carrier IPs": false,
      "Dedicated IPs": false,
      "Unlimited Bandwidth": false,
      "Sub-ms Latency": false,
      "Bulk Concurrency": true,
    },
    speed: "Medium",
    anonymity: "High",
    cost: "$$",
    poolSize: "72M+",
  },
  {
    name: "Mobile",
    icon: Smartphone,
    description: "4G/5G mobile carrier IPs globally",
    recommended: "Social media, app testing, mobile-first scraping",
    plan: "Enterprise",
    features: {
      "Real ISP IPs": true,
      "Geo-targeting (Country)": true,
      "Geo-targeting (City)": true,
      "Sticky Sessions": true,
      "Rotating IPs": true,
      "High Anonymity": true,
      "SOCKS5 Support": true,
      "Mobile Carrier IPs": true,
      "Dedicated IPs": false,
      "Unlimited Bandwidth": false,
      "Sub-ms Latency": false,
      "Bulk Concurrency": true,
    },
    speed: "Medium",
    anonymity: "Very High",
    cost: "$$$",
    poolSize: "12M+",
  },
  {
    name: "Datacenter",
    icon: Server,
    description: "Fast datacenter IPs for high-volume tasks",
    recommended: "Price monitoring, SEO, bulk data collection",
    plan: "Starter",
    features: {
      "Real ISP IPs": false,
      "Geo-targeting (Country)": true,
      "Geo-targeting (City)": false,
      "Sticky Sessions": true,
      "Rotating IPs": true,
      "High Anonymity": false,
      "SOCKS5 Support": true,
      "Mobile Carrier IPs": false,
      "Dedicated IPs": true,
      "Unlimited Bandwidth": true,
      "Sub-ms Latency": true,
      "Bulk Concurrency": true,
    },
    speed: "Very Fast",
    anonymity: "Medium",
    cost: "$",
    poolSize: "500K+",
  },
];

const featureKeys = Object.keys(proxyTypes[0].features);

const useCases = [
  { title: "Web Scraping", description: "Large-scale data extraction from websites", recommended: "Residential" },
  { title: "Ad Verification", description: "Verify ad placements across geos", recommended: "Residential" },
  { title: "Social Media", description: "Multi-account management and automation", recommended: "Mobile" },
  { title: "Price Monitoring", description: "Track competitor pricing in real-time", recommended: "Datacenter" },
  { title: "App Testing", description: "Test mobile apps from different locations", recommended: "Mobile" },
  { title: "SEO Monitoring", description: "Track SERP rankings across regions", recommended: "Datacenter" },
];

export default function ProxyComparisonPage() {
  return (
    <div className="pt-24 pb-16">
      <SEOHead title="Proxy Comparison — Residential vs Mobile vs Datacenter" description="Compare residential, mobile, and datacenter proxies. Find the best proxy type for your use case with our detailed comparison matrix." />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Proxy Type Comparison</h1>
          <p className="text-lg text-muted-foreground">Choose the right proxy type for your specific use case. Compare features, performance, and pricing across all proxy types.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {proxyTypes.map(pt => (
            <Card key={pt.name} variant="glow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><pt.icon className="w-6 h-6 text-primary" /></div>
                  <div>
                    <CardTitle>{pt.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{pt.poolSize} IPs</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{pt.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 rounded bg-secondary/30"><span className="text-muted-foreground">Speed:</span> <strong>{pt.speed}</strong></div>
                  <div className="p-2 rounded bg-secondary/30"><span className="text-muted-foreground">Anonymity:</span> <strong>{pt.anonymity}</strong></div>
                  <div className="p-2 rounded bg-secondary/30"><span className="text-muted-foreground">Cost:</span> <strong>{pt.cost}</strong></div>
                  <div className="p-2 rounded bg-secondary/30"><span className="text-muted-foreground">Plan:</span> <strong>{pt.plan}</strong></div>
                </div>
                <Button variant="hero" className="w-full" asChild>
                  <Link to="/signup">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Matrix */}
        <Card className="mb-12">
          <CardHeader><CardTitle className="text-xl">Feature Comparison Matrix</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                    {proxyTypes.map(pt => <th key={pt.name} className="text-center py-3 px-4 font-medium">{pt.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {featureKeys.map(feature => (
                    <tr key={feature} className="border-b border-border/50 hover:bg-secondary/20">
                      <td className="py-3 px-4">{feature}</td>
                      {proxyTypes.map(pt => (
                        <td key={pt.name} className="text-center py-3 px-4">
                          {pt.features[feature as keyof typeof pt.features]
                            ? <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                            : <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Recommended by Use Case</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {useCases.map(uc => (
              <Card key={uc.title}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-1">{uc.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{uc.description}</p>
                  <Badge variant="success">Best: {uc.recommended}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Sure Which to Choose?</h2>
          <p className="text-muted-foreground mb-6">Our proxy experts can help you find the perfect solution for your needs.</p>
          <div className="flex gap-3 justify-center">
            <Button variant="hero" asChild><Link to="/book-demo">Book a Demo</Link></Button>
            <Button variant="outline" asChild><Link to="/contact">Talk to Sales</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
