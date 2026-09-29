import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flag, FlaskConical, Rocket, Shield, Zap, Globe, Save } from "lucide-react";
import { toast } from "sonner";
import { useAdminFeatureFlags, useUpdateFeatureFlag } from "@/hooks/useAdmin";

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  beta: boolean;
  category: "core" | "experimental" | "security" | "performance";
  tenants: string[];
  rolloutPercentage: number;
  affectedPlans: string[];
}

const defaultFlags: FeatureFlag[] = [
  { id: "ff1", name: "Advanced Rotation Engine", description: "Next-gen IP rotation with ML-based selection", enabled: true, beta: false, category: "core", tenants: ["all"], rolloutPercentage: 100, affectedPlans: ["Starter", "Growth", "Enterprise"] },
  { id: "ff2", name: "Beta Analytics Dashboard", description: "Redesigned analytics with AI-powered insights", enabled: true, beta: true, category: "experimental", tenants: ["Acme Corp", "Zenith Data"], rolloutPercentage: 40, affectedPlans: ["Growth", "Enterprise"] },
  { id: "ff3", name: "Experimental Routing v2", description: "Next-gen supplier routing with cost optimization", enabled: false, beta: true, category: "experimental", tenants: [], rolloutPercentage: 0, affectedPlans: ["Enterprise"] },
  { id: "ff4", name: "Mobile Proxy Pool v2", description: "Upgraded mobile proxy pool with 5G support", enabled: true, beta: true, category: "core", tenants: ["all"], rolloutPercentage: 75, affectedPlans: ["Growth", "Enterprise"] },
  { id: "ff5", name: "AI Traffic Optimizer", description: "Machine learning traffic routing for optimal performance", enabled: false, beta: true, category: "performance", tenants: [], rolloutPercentage: 0, affectedPlans: ["Enterprise"] },
  { id: "ff6", name: "New Dashboard Charts", description: "Redesigned dashboard with advanced charting", enabled: true, beta: true, category: "core", tenants: ["Acme Corp"], rolloutPercentage: 25, affectedPlans: ["Starter", "Growth", "Enterprise"] },
  { id: "ff7", name: "Zero-Knowledge Logging", description: "Privacy-first logging mode for GDPR compliance", enabled: false, beta: true, category: "security", tenants: [], rolloutPercentage: 0, affectedPlans: ["Enterprise"] },
  { id: "ff8", name: "Predictive Scaling", description: "Auto-scale pool based on usage pattern prediction", enabled: false, beta: true, category: "performance", tenants: [], rolloutPercentage: 0, affectedPlans: ["Enterprise"] },
  { id: "ff9", name: "Geo-distributed Caching", description: "Edge caching layer for frequently accessed resources", enabled: true, beta: false, category: "performance", tenants: ["all"], rolloutPercentage: 100, affectedPlans: ["Starter", "Growth", "Enterprise"] },
  { id: "ff10", name: "Real-time Abuse Detection", description: "AI-powered abuse pattern recognition", enabled: true, beta: false, category: "security", tenants: ["all"], rolloutPercentage: 100, affectedPlans: ["Growth", "Enterprise"] },
];

const STORAGE_KEY = "baalvion-feature-flags";
const DEFAULT_CATEGORY = "core" as const;

const categoryIcons: Record<string, typeof Zap> = {
  core: Zap,
  experimental: FlaskConical,
  security: Shield,
  performance: Rocket,
};

const planColors: Record<string, string> = {
  Starter: "bg-muted text-muted-foreground",
  Growth: "bg-primary/10 text-primary",
  Enterprise: "bg-accent/10 text-accent-foreground",
};

export default function AdminFeatureFlags() {
  const { data: apiFlags = [] } = useAdminFeatureFlags();
  const updateFlag = useUpdateFeatureFlag();

  const flags: FeatureFlag[] = apiFlags.length > 0
    ? apiFlags.map((f) => ({
        id: f.id ?? f.key,
        name: f.name ?? f.key,
        description: String(f.key),
        enabled: f.enabled,
        beta: false,
        category: DEFAULT_CATEGORY,
        tenants: ["all"],
        rolloutPercentage: f.rolloutPercent ?? 100,
        affectedPlans: ["Starter", "Growth", "Enterprise"],
      }))
    : defaultFlags;

  const [env, setEnv] = useState<"production" | "development">("production");

  const toggle = (id: string) => {
    const flag = flags.find(f => f.id === id);
    if (!flag) return;
    const apiFlag = apiFlags.find(f => (f.id ?? f.key) === id);
    if (apiFlag) {
      updateFlag.mutate({ key: apiFlag.key, data: { enabled: !flag.enabled } });
    }
    toast.success("Feature flag updated");
  };

  const updateRollout = (id: string, value: number[]) => {
    const apiFlag = apiFlags.find(f => (f.id ?? f.key) === id);
    if (apiFlag) {
      updateFlag.mutate({ key: apiFlag.key, data: { rollout: value[0] } });
    }
  };

  const categories = ["core", "experimental", "security", "performance"] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flag className="w-6 h-6 text-primary" />Feature Flags
          </h1>
          <p className="text-muted-foreground">Control feature rollouts and kill switches across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={env} onValueChange={(v) => setEnv(v as typeof env)}>
            <SelectTrigger className="w-[180px] bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="production">🟢 Production</SelectItem>
              <SelectItem value="development">🟡 Development</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="stats"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total Flags</p><p className="text-2xl font-bold">{flags.length}</p></CardContent></Card>
        <Card variant="stats"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Enabled</p><p className="text-2xl font-bold text-success">{flags.filter(f => f.enabled).length}</p></CardContent></Card>
        <Card variant="stats"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Beta</p><p className="text-2xl font-bold text-warning">{flags.filter(f => f.beta).length}</p></CardContent></Card>
        <Card variant="stats"><CardContent className="p-6"><p className="text-sm text-muted-foreground">Disabled</p><p className="text-2xl font-bold text-destructive">{flags.filter(f => !f.enabled).length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(c => <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>)}
        </TabsList>

        {["all", ...categories].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
            {flags.filter(f => tab === "all" || f.category === tab).map(flag => {
              const Icon = categoryIcons[flag.category];
              return (
                <Card key={flag.id} className={`transition-all duration-200 ${flag.enabled ? "" : "opacity-60"}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{flag.name}</p>
                              {flag.beta && <Badge variant="warning" className="text-xs">Beta</Badge>}
                              <Badge variant="secondary" className="text-xs capitalize">{flag.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{flag.description}</p>
                          </div>

                          {/* Rollout Percentage */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Rollout</span>
                              <span className="text-xs font-medium">{flag.rolloutPercentage}%</span>
                            </div>
                            <Slider
                              value={[flag.rolloutPercentage]}
                              onValueChange={(v) => updateRollout(flag.id, v)}
                              max={100}
                              step={5}
                              className="w-full"
                              disabled={!flag.enabled}
                            />
                          </div>

                          {/* Affected Plans */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-muted-foreground">Plans:</span>
                            {flag.affectedPlans.map(plan => (
                              <Badge key={plan} variant="outline" className={`text-xs ${planColors[plan] || ""}`}>
                                {plan}
                              </Badge>
                            ))}
                          </div>

                          {flag.tenants.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{flag.tenants.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={() => toggle(flag.id)}
                        aria-label={`Toggle ${flag.name}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
