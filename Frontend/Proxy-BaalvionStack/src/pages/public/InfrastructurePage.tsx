import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Globe, Activity, Shield, Zap, Clock } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const regions = [
  { name: "North America", cities: ["Ashburn", "San Jose", "Dallas", "Toronto"], ips: "18M+", latency: "12ms", uptime: "99.99%", status: "operational" },
  { name: "Europe", cities: ["Frankfurt", "London", "Amsterdam", "Paris"], ips: "22M+", latency: "18ms", uptime: "99.98%", status: "operational" },
  { name: "Asia Pacific", cities: ["Tokyo", "Singapore", "Mumbai", "Sydney"], ips: "15M+", latency: "45ms", uptime: "99.97%", status: "operational" },
  { name: "South America", cities: ["São Paulo", "Buenos Aires"], ips: "5M+", latency: "65ms", uptime: "99.95%", status: "operational" },
  { name: "Middle East", cities: ["Dubai", "Tel Aviv"], ips: "3M+", latency: "55ms", uptime: "99.96%", status: "operational" },
  { name: "Africa", cities: ["Johannesburg", "Lagos"], ips: "2M+", latency: "80ms", uptime: "99.93%", status: "degraded" },
];

const stats = [
  { label: "Global IP Pool", value: "72M+", icon: Globe },
  { label: "Data Centers", value: "195+", icon: Server },
  { label: "Countries", value: "195", icon: Globe },
  { label: "Avg Uptime", value: "99.97%", icon: Activity },
  { label: "Avg Latency", value: "35ms", icon: Zap },
  { label: "ISP Partners", value: "1,200+", icon: Shield },
];

export default function InfrastructurePage() {
  return (
    <div className="pt-24 pb-16">
      <SEOHead title="Global Infrastructure — Baalvion NetStack" description="Explore Baalvion's global proxy infrastructure spanning 195 countries with 72M+ IPs, sub-50ms latency, and 99.97% uptime." />
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4"><Server className="w-3 h-3 mr-1" />Global Infrastructure</Badge>
          <h1 className="text-4xl font-bold mb-4">Built for Scale, Engineered for Speed</h1>
          <p className="text-lg text-muted-foreground">Our distributed infrastructure spans 195 countries with over 72 million IPs, ensuring low-latency access from anywhere in the world.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {stats.map(s => (
            <Card key={s.label} variant="stats">
              <CardContent className="p-6 text-center">
                <s.icon className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SVG World Map Placeholder */}
        <Card className="mb-12">
          <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Globe className="w-5 h-5 text-primary" />Data Center Locations</CardTitle></CardHeader>
          <CardContent>
            <div className="relative w-full aspect-[2/1] bg-secondary/20 rounded-xl border border-border/50 overflow-hidden">
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                {/* Simplified continent shapes */}
                <ellipse cx="250" cy="200" rx="120" ry="100" fill="hsl(var(--primary))" opacity="0.1" stroke="hsl(var(--primary))" strokeWidth="1" opacity-stroke="0.3" />
                <ellipse cx="500" cy="180" rx="130" ry="110" fill="hsl(var(--primary))" opacity="0.1" stroke="hsl(var(--primary))" strokeWidth="1" />
                <ellipse cx="750" cy="200" rx="120" ry="100" fill="hsl(var(--primary))" opacity="0.1" stroke="hsl(var(--primary))" strokeWidth="1" />
                <ellipse cx="500" cy="350" rx="60" ry="70" fill="hsl(var(--primary))" opacity="0.05" stroke="hsl(var(--primary))" strokeWidth="1" />
                <ellipse cx="250" cy="380" rx="50" ry="50" fill="hsl(var(--primary))" opacity="0.05" stroke="hsl(var(--primary))" strokeWidth="1" />
                {/* Data center dots */}
                {[
                  { x: 230, y: 170, label: "Ashburn" }, { x: 200, y: 180, label: "San Jose" },
                  { x: 220, y: 200, label: "Dallas" }, { x: 240, y: 155, label: "Toronto" },
                  { x: 490, y: 160, label: "Frankfurt" }, { x: 470, y: 150, label: "London" },
                  { x: 500, y: 155, label: "Amsterdam" }, { x: 485, y: 165, label: "Paris" },
                  { x: 770, y: 170, label: "Tokyo" }, { x: 740, y: 230, label: "Singapore" },
                  { x: 680, y: 200, label: "Mumbai" }, { x: 800, y: 310, label: "Sydney" },
                  { x: 280, y: 340, label: "São Paulo" }, { x: 600, y: 220, label: "Dubai" },
                  { x: 520, y: 340, label: "Johannesburg" },
                ].map(dc => (
                  <g key={dc.label}>
                    <circle cx={dc.x} cy={dc.y} r="6" fill="hsl(var(--primary))" opacity="0.8">
                      <animate attributeName="r" values="4;8;4" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0.4;0.8" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={dc.x} cy={dc.y} r="3" fill="hsl(var(--primary))" />
                  </g>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Region Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regions.map(r => (
            <Card key={r.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{r.name}</CardTitle>
                  <Badge variant={r.status === "operational" ? "success" : "warning"}>{r.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="p-2 rounded bg-secondary/30 text-center">
                    <p className="text-xs text-muted-foreground">IPs</p>
                    <p className="font-bold">{r.ips}</p>
                  </div>
                  <div className="p-2 rounded bg-secondary/30 text-center">
                    <p className="text-xs text-muted-foreground">Latency</p>
                    <p className="font-bold">{r.latency}</p>
                  </div>
                  <div className="p-2 rounded bg-secondary/30 text-center">
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-bold">{r.uptime}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.cities.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
