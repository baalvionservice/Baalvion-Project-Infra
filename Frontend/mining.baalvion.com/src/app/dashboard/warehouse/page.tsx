
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Warehouse, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldAlert, 
  Boxes, 
  Activity, 
  Map as MapIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function WarehouseDashboard() {
  const [inbound] = useState([
    { id: "IN-882", source: "Blue Ridge Mine", material: "Iron Ore", qty: "450 MT", status: "UNLOADING" },
    { id: "IN-885", source: "Summit Lithium", material: "Lithium", qty: "120 MT", status: "PENDING_INSPECTION" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Warehouse Command</h1>
          <p className="text-muted-foreground mt-1">Durban Export Stockyard • Facility ID: WH-7721</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Activity className="h-4 w-4" /> Activity Logs</Button>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <ArrowDownLeft className="h-4 w-4" /> Log Inbound Arrival
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase">Storage Capacity</p>
                <Boxes className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold">
                  <span>82% Used</span>
                  <span>41,200 / 50,000 MT</span>
                </div>
                <Progress value={82} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {[
          { label: "Active Batches", val: "142", icon: Warehouse, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Inbound Today", val: "1,240 MT", icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Outbound Today", val: "850 MT", icon: ArrowUpRight, color: "text-primary", bg: "bg-primary/5" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</p>
                <h3 className="text-xl font-bold">{stat.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Arrivals & Inspections</CardTitle>
              <CardDescription>Inbound materials awaiting quality clearance.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-secondary font-bold">View Inbound Queue</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arrival ID</TableHead>
                  <TableHead>Source / Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inbound.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell className="font-bold text-primary">{item.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.material}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{item.source}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">{item.qty}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-xs font-bold text-primary">Inspect</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-secondary" />
                Storage Zoning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { zone: "Zone A (Silo 1)", material: "Copper Fine", used: 95 },
                { zone: "Zone B (Yard 4)", material: "Iron Ore", used: 60 },
                { zone: "Zone C (Bonded)", material: "Gold Bullion", used: 25 },
              ].map((z, idx) => (
                <div key={idx} className="space-y-2 p-3 bg-white/10 rounded-lg border border-white/10">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{z.zone}</span>
                    <span className={z.used > 90 ? "text-rose-400" : "text-secondary"}>{z.used}% Full</span>
                  </div>
                  <Progress value={z.used} className="h-1 bg-white/10" />
                  <p className="text-[10px] text-primary-foreground/60">{z.material}</p>
                </div>
              ))}
              <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white mt-2">
                Optimize Allocation
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
                Quality Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                <p className="text-xs font-bold text-rose-700">Contamination Risk: Batch #772</p>
                <p className="text-[10px] text-rose-600">Moisture levels exceed 12% in Zone B. Immediate re-sampling required.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
