import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/platformClient";
import { pricingPlans as fallbackPlans } from "@/data/mockData";

const additionalPlans = [
  {
    name: "Pay As You Go",
    price: 3,
    unit: "per GB",
    bandwidth: "No commitment",
    features: ["All Proxy Types", "195 Countries", "HTTP/SOCKS5", "Basic Support"],
    popular: false,
  },
];

export default function PricingPage() {
  const { data: pricingPlans = fallbackPlans } = useQuery({
    queryKey: ["public", "plans"],
    queryFn: () => publicApi.plans(),
    staleTime: 5 * 60 * 1000,
  });
  return (
    <div className="container mx-auto px-4 py-24">
      <SEOHead 
        title="Pricing — Transparent Proxy Plans" 
        description="Simple, transparent pricing for residential, mobile and datacenter proxies. No hidden fees. Pay only for what you use. Scale up or down anytime."
        canonical="https://baalvion.com/pricing"
      />
      {/* Header */}
      <div className="text-center mb-16">
        <Badge variant="info" className="mb-4">Pricing</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          No hidden fees. No surprises. Pay only for what you use. 
          Scale up or down anytime with our flexible plans.
        </p>
      </div>

      {/* Main Plans */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
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
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4">
                <span className="text-5xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mb-6">{plan.bandwidth} bandwidth</p>
              
              <ul className="space-y-3 mb-8 text-left">
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

      {/* Pay As You Go */}
      <Card variant="glass" className="max-w-3xl mx-auto mb-16">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Pay As You Go</h3>
              <p className="text-muted-foreground">
                No monthly commitment. Perfect for testing or occasional use.
              </p>
            </div>
            <div className="text-center md:text-right">
              <div className="mb-2">
                <span className="text-4xl font-bold">$3</span>
                <span className="text-muted-foreground">/GB</span>
              </div>
              <Button variant="outline" asChild>
                <Link to="/signup">Start Now</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enterprise */}
      <Card variant="glow" className="max-w-3xl mx-auto">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Need a Custom Solution?</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Large volume needs? Custom integrations? Dedicated support? 
            Our enterprise team is ready to help.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/contact">Contact Sales</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center mt-16">
        <p className="text-sm text-muted-foreground">
          Baalvion NetStack is a product of Baalvion Industries Private Limited.
        </p>
      </div>
    </div>
  );
}
