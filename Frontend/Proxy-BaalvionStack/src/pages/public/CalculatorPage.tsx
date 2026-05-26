import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calculator, 
  Globe, 
  Zap,
  ArrowRight,
  CheckCircle,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { pricingPlans } from "@/data/mockData";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const useCases = [
  { value: "scraping", label: "Web Scraping", avgRequestSize: 0.5, avgRequests: 50000 },
  { value: "seo", label: "SEO Monitoring", avgRequestSize: 0.3, avgRequests: 100000 },
  { value: "price", label: "Price Monitoring", avgRequestSize: 0.2, avgRequests: 200000 },
  { value: "social", label: "Social Media", avgRequestSize: 1.0, avgRequests: 20000 },
  { value: "ad", label: "Ad Verification", avgRequestSize: 0.8, avgRequests: 30000 },
  { value: "custom", label: "Custom", avgRequestSize: 0.5, avgRequests: 50000 },
];

const proxyTypes = [
  { value: "residential", label: "Residential", costPerGB: 3.5 },
  { value: "mobile", label: "Mobile", costPerGB: 5.0 },
  { value: "datacenter", label: "Datacenter", costPerGB: 0.5 },
];

export default function CalculatorPage() {
  const [useCase, setUseCase] = useState("scraping");
  const [proxyType, setProxyType] = useState("residential");
  const [requestsPerDay, setRequestsPerDay] = useState(50000);
  const [avgPageSize, setAvgPageSize] = useState(500); // in KB
  const [countries, setCountries] = useState(5);

  const selectedUseCase = useCases.find(u => u.value === useCase);
  const selectedProxyType = proxyTypes.find(p => p.value === proxyType);

  // Calculate bandwidth
  const dailyBandwidthMB = (requestsPerDay * avgPageSize) / 1024;
  const dailyBandwidthGB = dailyBandwidthMB / 1024;
  const monthlyBandwidthGB = dailyBandwidthGB * 30;

  // Calculate cost
  const baseCostPerGB = selectedProxyType?.costPerGB || 3.5;
  const countryMultiplier = countries > 10 ? 1.0 : countries > 5 ? 1.1 : 1.2;
  const volumeDiscount = monthlyBandwidthGB > 500 ? 0.7 : monthlyBandwidthGB > 100 ? 0.85 : 1.0;
  const estimatedMonthlyCost = monthlyBandwidthGB * baseCostPerGB * countryMultiplier * volumeDiscount;

  // Recommend plan
  const recommendedPlan = pricingPlans.find(plan => {
    const planGB = parseInt(plan.bandwidth) || 1000;
    return monthlyBandwidthGB <= planGB;
  }) || pricingPlans[pricingPlans.length - 1];

  const handleUseCaseChange = (value: string) => {
    setUseCase(value);
    const selected = useCases.find(u => u.value === value);
    if (selected && value !== "custom") {
      setRequestsPerDay(selected.avgRequests);
      setAvgPageSize(selected.avgRequestSize * 1024);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="outline" className="mb-4">
              <Calculator className="w-3 h-3 mr-1" />
              Bandwidth Calculator
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Estimate Your Proxy Needs
            </h1>
            <p className="text-xl text-muted-foreground">
              Use our calculator to estimate bandwidth requirements and find the perfect plan for your use case.
            </p>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-12 pb-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card variant="default">
                <CardHeader>
                  <CardTitle className="text-lg">Configure Your Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Use Case */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      Use Case
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Select your primary use case for pre-configured estimates
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select value={useCase} onValueChange={handleUseCaseChange}>
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {useCases.map((uc) => (
                          <SelectItem key={uc.value} value={uc.value}>
                            {uc.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Proxy Type */}
                  <div className="space-y-3">
                    <Label>Proxy Type</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {proxyTypes.map((type) => (
                        <Button
                          key={type.value}
                          variant={proxyType === type.value ? "default" : "outline"}
                          className="h-auto py-4 flex-col gap-1"
                          onClick={() => setProxyType(type.value)}
                        >
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ${type.costPerGB}/GB
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Requests per Day */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Requests per Day</Label>
                      <span className="text-sm font-mono text-primary">
                        {requestsPerDay.toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      value={[requestsPerDay]}
                      onValueChange={([v]) => setRequestsPerDay(v)}
                      min={1000}
                      max={1000000}
                      step={1000}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1K</span>
                      <span>1M</span>
                    </div>
                  </div>

                  {/* Average Page Size */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        Average Response Size
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Average size of data returned per request
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <span className="text-sm font-mono text-primary">
                        {avgPageSize >= 1024 ? `${(avgPageSize / 1024).toFixed(1)} MB` : `${avgPageSize} KB`}
                      </span>
                    </div>
                    <Slider
                      value={[avgPageSize]}
                      onValueChange={([v]) => setAvgPageSize(v)}
                      min={10}
                      max={5120}
                      step={10}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 KB</span>
                      <span>5 MB</span>
                    </div>
                  </div>

                  {/* Countries */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Target Countries
                      </Label>
                      <span className="text-sm font-mono text-primary">{countries}</span>
                    </div>
                    <Slider
                      value={[countries]}
                      onValueChange={([v]) => setCountries(v)}
                      min={1}
                      max={50}
                      step={1}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1</span>
                      <span>50+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              <Card variant="stats">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Estimated Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-border/50">
                      <span className="text-muted-foreground">Daily Bandwidth</span>
                      <span className="font-mono font-bold text-lg">
                        {dailyBandwidthGB >= 1 
                          ? `${dailyBandwidthGB.toFixed(1)} GB` 
                          : `${dailyBandwidthMB.toFixed(0)} MB`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border/50">
                      <span className="text-muted-foreground">Monthly Bandwidth</span>
                      <span className="font-mono font-bold text-lg text-primary">
                        {monthlyBandwidthGB.toFixed(0)} GB
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border/50">
                      <span className="text-muted-foreground">Requests/Month</span>
                      <span className="font-mono font-bold">
                        {(requestsPerDay * 30 / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
                    <p className="text-3xl font-bold text-primary">
                      ${estimatedMonthlyCost.toFixed(0)}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                    {volumeDiscount < 1 && (
                      <Badge variant="success" className="mt-2">
                        Volume discount applied
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recommended Plan */}
              <Card variant="default" className="border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Recommended Plan</CardTitle>
                    <Badge variant="default">Best Value</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{recommendedPlan.name}</h3>
                    <p className="text-3xl font-bold text-primary">
                      ${recommendedPlan.price}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    {recommendedPlan.features.slice(0, 4).map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button variant="hero" className="w-full" asChild>
                    <Link to="/signup">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    7-day free trial • No credit card required
                  </p>
                </CardContent>
              </Card>

              {/* Need Help */}
              <Card variant="default" className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Need help choosing the right plan? Our team can provide a custom quote for your specific needs.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/pricing">View All Plans</Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-secondary/20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Understanding Bandwidth Usage</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card variant="default" className="p-6">
                <h3 className="font-semibold mb-2">Web Scraping</h3>
                <p className="text-sm text-muted-foreground">
                  Typical pages: 100KB - 1MB per request. HTML-only requests are smaller.
                </p>
              </Card>
              <Card variant="default" className="p-6">
                <h3 className="font-semibold mb-2">API Requests</h3>
                <p className="text-sm text-muted-foreground">
                  JSON responses: 1KB - 100KB. Lightweight and efficient for data extraction.
                </p>
              </Card>
              <Card variant="default" className="p-6">
                <h3 className="font-semibold mb-2">Media Content</h3>
                <p className="text-sm text-muted-foreground">
                  Images and videos: 500KB - 10MB+. Consider compression when possible.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <Zap className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start your 7-day free trial today and experience the power of Baalvion NetStack's proxy network.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/case-studies">View Success Stories</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}