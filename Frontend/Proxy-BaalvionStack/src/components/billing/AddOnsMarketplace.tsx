import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ShoppingCart, Sparkles, Calculator } from "lucide-react";
import { addOns, AddOn, overageRates } from "@/data/addOnsData";

export function AddOnsMarketplace() {
  const [enabledAddOns, setEnabledAddOns] = useState<Record<string, boolean>>(
    Object.fromEntries(addOns.map((a) => [a.id, a.enabled]))
  );
  const [overageGB, setOverageGB] = useState(0);

  const toggle = (id: string) => setEnabledAddOns((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalAddOns = addOns.reduce((sum, a) => sum + (enabledAddOns[a.id] ? a.price : 0), 0);
  const overageCost = overageGB * overageRates.residential.perGB;

  return (
    <div className="space-y-6">
      {/* Add-Ons Grid */}
      <Card variant="default">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                Add-Ons Marketplace
              </CardTitle>
              <CardDescription>Enhance your plan with premium features</CardDescription>
            </div>
            <Badge variant="info" className="gap-1">
              <Sparkles className="w-3 h-3" />
              {Object.values(enabledAddOns).filter(Boolean).length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {addOns.map((addon) => (
              <div
                key={addon.id}
                className={`p-4 rounded-xl border transition-all ${
                  enabledAddOns[addon.id]
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{addon.name}</h4>
                      {addon.popular && <Badge variant="default" className="text-xs">Popular</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{addon.description}</p>
                  </div>
                  <Switch checked={enabledAddOns[addon.id]} onCheckedChange={() => toggle(addon.id)} />
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <Badge variant="muted" className="text-xs">{addon.category}</Badge>
                  <span className="text-sm font-bold text-primary">${addon.price}{addon.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overage Estimator */}
      <Card variant="default">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Overage Estimator
          </CardTitle>
          <CardDescription>Estimate your costs for usage beyond plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Estimated Overage</span>
              <span className="text-sm font-bold">{overageGB} GB</span>
            </div>
            <Slider value={[overageGB]} onValueChange={([v]) => setOverageGB(v)} min={0} max={200} step={5} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 GB</span><span>200 GB</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">Residential</p>
              <p className="text-lg font-bold">${(overageGB * overageRates.residential.perGB).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">${overageRates.residential.perGB}/GB</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">Mobile</p>
              <p className="text-lg font-bold">${(overageGB * overageRates.mobile.perGB).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">${overageRates.mobile.perGB}/GB</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/30 text-center">
              <p className="text-xs text-muted-foreground">Datacenter</p>
              <p className="text-lg font-bold">${(overageGB * overageRates.datacenter.perGB).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">${overageRates.datacenter.perGB}/GB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Running Total */}
      <Card variant="glow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimated Monthly Total</p>
              <p className="text-3xl font-bold">${(149 + totalAddOns + overageCost).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">Base plan ($149) + Add-ons (${totalAddOns}) + Est. overage (${overageCost.toFixed(2)})</p>
            </div>
            <Button variant="hero">Update Subscription</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}