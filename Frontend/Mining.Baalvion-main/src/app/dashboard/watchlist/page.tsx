
"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Star, 
  Bell, 
  Trash2, 
  Filter, 
  Search, 
  Gem, 
  Building2, 
  ClipboardList, 
  ArrowRight,
  TrendingUp,
  History,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState("all");

  const trackedProducts = [
    { id: "P-101", name: "Iron Ore Fine", grade: "62% Fe", supplier: "Atlas Mining", price: "$105/MT", trend: "stable" },
    { id: "P-105", name: "Lithium Spodumene", grade: "SC 6.0", supplier: "Summit Lithium", price: "$1,120/MT", trend: "up" },
  ];

  const trackedSuppliers = [
    { id: "S-001", name: "Global Mining Inc.", country: "South Africa", rating: 4.9, status: "Active" },
    { id: "S-004", name: "Andean Silver Corp", country: "Peru", rating: 4.8, status: "Away" },
  ];

  const watchedRfqs = [
    { id: "RFQ-7281", title: "Copper Concentrate Supply", volume: "10,000 MT", deadline: "2 days left", bids: 12 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
            <Heart className="h-8 w-8 text-rose-500 fill-rose-500" />
            My Trade Watchlist
          </h1>
          <p className="text-muted-foreground mt-1">Monitor your favorite products, suppliers, and procurement opportunities.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" /> Notification Settings
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Tracked Products", val: "12", icon: Gem, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Followed Suppliers", val: "08", icon: Building2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Active Watchlist", val: "04", icon: ClipboardList, color: "text-primary", bg: "bg-primary/5" },
          { label: "New Alerts", val: "03", icon: Bell, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="products" className="w-full" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between border-b pb-1">
              <TabsList className="bg-transparent h-auto p-0 gap-8">
                {["Products", "Suppliers", "RFQs"].map((t) => (
                  <TabsTrigger 
                    key={t}
                    value={t.toLowerCase()} 
                    className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-sm"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input placeholder="Search tracked..." className="pl-8 h-8 text-xs w-48 border-slate-200" />
                </div>
              </div>
            </div>

            <TabsContent value="products" className="space-y-4 pt-4">
              {trackedProducts.map((p) => (
                <Card key={p.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Gem className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{p.name}</h4>
                        <p className="text-xs text-slate-500">Grade: {p.grade} • {p.supplier}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{p.price}</p>
                        <span className={cn(
                          "text-[9px] font-bold uppercase",
                          p.trend === "up" ? "text-amber-600" : "text-emerald-600"
                        )}>{p.trend}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary"><ArrowRight className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-4 pt-4">
              {trackedSuppliers.map((s) => (
                <Card key={s.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{s.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">{s.country}</span>
                          <div className="flex items-center gap-1 text-amber-400">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-[10px] font-bold text-slate-900">{s.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-[9px] font-bold h-5 uppercase">{s.status}</Badge>
                      <Button variant="outline" size="sm" className="font-bold text-[10px] h-8">View Profile</Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="rfqs" className="space-y-4 pt-4">
              {watchedRfqs.map((r) => (
                <Card key={r.id} className="border-none shadow-sm group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{r.title}</h4>
                        <p className="text-xs text-slate-500">{r.volume} • {r.bids} Active Bids</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
                        <Clock className="h-3.5 w-3.5" /> {r.deadline}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="h-48 w-48" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Proactive Intelligence</CardTitle>
              <CardDescription className="text-slate-400">Automated alerts from your watchlist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="space-y-4">
                {[
                  { msg: "Price Drop: Iron Ore (-$4.20)", time: "2h ago", type: "price" },
                  { msg: "New Bid on watched RFQ-7281", time: "5h ago", type: "rfq" },
                  { msg: "Global Mining Inc. updated rating", time: "1d ago", type: "supplier" },
                ].map((alert, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className={cn(
                      "h-8 w-8 rounded flex items-center justify-center shrink-0",
                      alert.type === "price" ? "bg-emerald-500/20 text-emerald-400" :
                      alert.type === "rfq" ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-400"
                    )}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{alert.msg}</p>
                      <p className="text-[10px] text-slate-500">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-11 shadow-lg">
                View All Notification Logs
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Market Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Compare your tracked items against global marketplace benchmarks to identify arbitrage opportunities.
              </p>
              <Button variant="outline" className="w-full text-xs font-bold gap-2">
                Launch Comparator Tool <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
