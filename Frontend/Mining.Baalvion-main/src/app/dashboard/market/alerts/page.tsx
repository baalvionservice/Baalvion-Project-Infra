
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BellRing, 
  Plus, 
  Bell, 
  Trash2, 
  Settings2, 
  ArrowUp, 
  ArrowDown, 
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState([
    { id: 1, mineral: "Iron Ore", grade: "62% Fe", condition: "ABOVE", price: 120, isActive: true },
    { id: 2, mineral: "Lithium", grade: "SC 6.0", condition: "BELOW", price: 1000, isActive: false },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
            <BellRing className="h-8 w-8 text-secondary" />
            Market Price Alerts
          </h1>
          <p className="text-muted-foreground mt-1">Configure automated notifications for critical mineral price movements.</p>
        </div>
        <Button className="bg-primary text-white font-bold gap-2 shadow-lg">
          <Plus className="h-4 w-4" /> Create New Alert
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {alerts.map((alert) => (
            <Card key={alert.id} className={cn(
              "border-none shadow-sm transition-all",
              !alert.isActive && "opacity-60 grayscale"
            )}>
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "p-4 rounded-2xl",
                    alert.condition === "ABOVE" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {alert.condition === "ABOVE" ? <ArrowUp className="h-8 w-8" /> : <ArrowDown className="h-8 w-8" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-lg text-slate-900">{alert.mineral}</h4>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">{alert.grade}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Notify me when price goes <span className="font-bold">{alert.condition}</span> 
                      <span className="text-primary ml-1">${alert.price} /MT</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="flex items-center gap-2 mr-4">
                    <span className="text-xs font-bold text-slate-400 uppercase">Active</span>
                    <Switch checked={alert.isActive} />
                  </div>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-primary"><Settings2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {alerts.length === 0 && (
            <div className="h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-12 bg-slate-50/50">
              <Bell className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-900">No active alerts</h3>
              <p className="text-sm text-slate-500 max-w-xs mt-2">Set up alerts to monitor price thresholds and capture arbitrage opportunities.</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary" />
                Quick Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-primary-foreground/60">Mineral</Label>
                <Select>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select mineral" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iron">Iron Ore</SelectItem>
                    <SelectItem value="copper">Copper</SelectItem>
                    <SelectItem value="lith">Lithium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-primary-foreground/60">Condition</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">Above</Button>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">Below</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-primary-foreground/60">Target Price (USD)</Label>
                <Input type="number" className="bg-white/10 border-white/20 text-white placeholder:text-white/30" placeholder="0.00" />
              </div>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold mt-4 shadow-lg">
                Activate Quick Alert
              </Button>
            </CardContent>
          </Card>

          <Alert className="bg-blue-50 border-blue-100">
            <Info className="h-4 w-4 text-blue-600" />
            <div className="ml-2">
              <p className="text-xs font-bold text-blue-700 uppercase">Alert Delivery</p>
              <p className="text-[10px] text-blue-600 leading-relaxed mt-1">
                Alerts are delivered via In-Platform notifications and real-time push events. Ensure "Trade Alerts" is enabled in your system settings.
              </p>
            </div>
          </Alert>
        </div>
      </div>
    </div>
  );
}

import { Alert } from "@/components/ui/alert";
