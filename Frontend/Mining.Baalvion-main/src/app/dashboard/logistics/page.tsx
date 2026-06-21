
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Truck, 
  MapPin, 
  TrendingUp, 
  Clock, 
  Plus, 
  ArrowRight, 
  DollarSign, 
  ShieldCheck,
  History,
  Anchor
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function LogisticsHub() {
  const [activeShipments] = useState([
    { id: "SHP-101", order: "ORD-9921", route: "Durban → Shanghai", type: "SEA", status: "IN_TRANSIT", eta: "Jun 12" },
    { id: "SHP-104", order: "ORD-9918", route: "Carajás → Belem", type: "RAIL", status: "LOADING", eta: "May 22" },
    { id: "SHP-105", order: "ORD-9915", route: "Pilbara → Port Hedland", type: "TRUCK", status: "PICKUP", eta: "May 20" },
  ]);

  const [pendingBids] = useState([
    { id: "REQ-728", cargo: "Copper Concentrate", qty: "2,000 MT", route: "Durban → Mumbai", deadline: "2h left" },
    { id: "REQ-730", cargo: "Iron Ore Fine", qty: "15,000 MT", route: "Belem → Rotterdam", deadline: "5h left" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Logistics Command</h1>
          <p className="text-muted-foreground mt-1">Manage global freight operations and fleet utilization.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <History className="h-4 w-4" /> Transit Logs
          </Button>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <Plus className="h-4 w-4" /> New Freight Bid
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Shipments", val: "12", icon: Truck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Fleet Ready", val: "85%", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Bids", val: "08", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Freight Revenue", val: "$2.1M", icon: DollarSign, color: "text-primary", bg: "bg-primary/5" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">{stat.label}</p>
                  <h3 className="text-2xl font-bold">{stat.val}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Shipments</CardTitle>
              <CardDescription>Real-time transit status of mineral cargo.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-secondary">Track All</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID / Order</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeShipments.map((shp) => (
                  <TableRow key={shp.id} className="hover:bg-muted/20">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{shp.id}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{shp.order}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{shp.route}</TableCell>
                    <TableCell>
                      {shp.type === "SEA" ? <Anchor className="h-4 w-4 text-blue-500" /> : <Truck className="h-4 w-4 text-slate-500" />}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {shp.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{shp.eta}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowRight className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Opportunities
              </CardTitle>
              <CardDescription className="text-primary-foreground/60">New shipment requests in your region.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingBids.map((bid) => (
                <div key={bid.id} className="p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold">{bid.cargo}</p>
                    <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded font-bold uppercase tracking-wider">{bid.deadline}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
                    <MapPin className="h-3 w-3" />
                    {bid.route}
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs font-bold">{bid.qty}</span>
                    <Button size="sm" className="h-7 bg-secondary text-secondary-foreground text-[10px] font-bold">Submit Bid</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Fleet Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Trucks (Heavy Duty)</span>
                <span className="font-bold">42/50 Active</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[84%]" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bulk Vessels</span>
                <span className="font-bold">04/05 Active</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="bg-secondary h-full w-[80%]" />
              </div>
              <Button variant="outline" className="w-full text-xs font-bold mt-2" onClick={() => window.location.href='/dashboard/fleet'}>
                Manage Fleet Assets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
