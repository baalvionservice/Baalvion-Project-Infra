import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const comparisons = [
  { feature: "Residential Proxies", smb: true, enterprise: true },
  { feature: "Mobile Proxies", smb: true, enterprise: true },
  { feature: "Datacenter Proxies", smb: true, enterprise: true },
  { feature: "195+ Countries", smb: true, enterprise: true },
  { feature: "Dashboard & Analytics", smb: true, enterprise: true },
  { feature: "API Access", smb: true, enterprise: true },
  { feature: "Sub-user Management", smb: "Up to 5", enterprise: "Unlimited" },
  { feature: "Bandwidth", smb: "Up to 500 GB/mo", enterprise: "Custom TB-scale" },
  { feature: "Concurrent Sessions", smb: "1,000", enterprise: "Unlimited" },
  { feature: "SLA Guarantee", smb: "99.9%", enterprise: "99.99% (custom)" },
  { feature: "Dedicated Account Manager", smb: false, enterprise: true },
  { feature: "Private IP Pools", smb: false, enterprise: true },
  { feature: "Custom Routing Rules", smb: false, enterprise: true },
  { feature: "White-Label Options", smb: false, enterprise: true },
  { feature: "SSO / SAML", smb: false, enterprise: true },
  { feature: "Custom Contracts (Net-30/60)", smb: false, enterprise: true },
  { feature: "On-premise Deployment", smb: false, enterprise: true },
  { feature: "Multi-Org Hierarchy", smb: false, enterprise: true },
  { feature: "Audit Log Retention", smb: "30 days", enterprise: "Unlimited" },
  { feature: "Priority Support", smb: "Email", enterprise: "24/7 Phone + Slack" },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-success mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm font-medium">{value}</span>;
}

export default function EnterpriseSMBComparisonPage() {
  return (
    <div className="container mx-auto px-4 py-24">
      <SEOHead
        title="Enterprise vs SMB — Feature Comparison"
        description="Compare Baalvion NetStack features for small businesses and enterprise organizations. Find the right plan for your team's needs."
        canonical="https://baalvion.com/enterprise-vs-smb"
      />
      <div className="text-center mb-16">
        <Badge variant="info" className="mb-4">Compare Plans</Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Enterprise vs SMB</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Whether you're a growing startup or a global organization, Baalvion NetStack scales with you.
        </p>
      </div>

      <Card className="max-w-4xl mx-auto overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-semibold w-1/2">Feature</th>
                  <th className="text-center p-4 text-sm font-semibold w-1/4">
                    <div className="space-y-1">
                      <Badge variant="secondary">SMB</Badge>
                      <p className="text-xs text-muted-foreground font-normal">Starter – Business</p>
                    </div>
                  </th>
                  <th className="text-center p-4 text-sm font-semibold w-1/4">
                    <div className="space-y-1">
                      <Badge variant="default">Enterprise</Badge>
                      <p className="text-xs text-muted-foreground font-normal">Custom plans</p>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <tr key={i} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                    <td className="p-4 text-sm">{row.feature}</td>
                    <td className="p-4 text-center"><CellValue value={row.smb} /></td>
                    <td className="p-4 text-center"><CellValue value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
        <Card variant="default">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-2">For SMBs</h3>
            <p className="text-muted-foreground text-sm mb-6">Get started with self-serve plans. No commitment required.</p>
            <Button variant="outline" asChild><Link to="/pricing">View Pricing <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
          </CardContent>
        </Card>
        <Card variant="glow">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-2">For Enterprises</h3>
            <p className="text-muted-foreground text-sm mb-6">Custom contracts, dedicated support, and private infrastructure.</p>
            <Button variant="hero" asChild><Link to="/book-demo">Book a Demo <ArrowRight className="w-4 h-4 ml-1" /></Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
