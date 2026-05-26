
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Truck, 
  Ship, 
  MapPin, 
  Activity, 
  ShieldCheck, 
  Globe, 
  Plus, 
  Search, 
  Filter, 
  History,
  AlertCircle,
  CheckCircle2,
  Anchor,
  Settings2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdminLogisticsGovernance() {
  const [carriers] = useState([
    { id: "CAR-001", name: "Maersk Global", type: "SEA", fleet: 142, rating: 4.9, status: "VERIFIED" },
    { id: "CAR-005", name: "DHL Industrial", type: "TRUCK", fleet: 850, rating: 4.7, status: "VERIFIED" },
    { id: "CAR-012", name: "Trans-Africa Rail", type: "RAIL", fleet: 24, rating: 4.2, status: "UNDER_REVIEW" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            Logistics Governance
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Manage global carriers, port operational status, and supply chain integrity.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <History className="h-4 w-4" /> Transit Audits
          </Button>
          <Button className="bg-primary text-white font-bold gap-2">
            <Plus className="h-4 w-4" /> Register Carrier
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: "Active Carriers", val: "124", icon: ShieldCheck, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Critical Ports", val: "12 / 12", icon: Anchor, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Active Shipments", val: "1,242", icon: Activity, color: "text-primary", bg: "bg-primary/5" },
          { label: "Logistics Risk", val: "Low", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
            <div>
              <CardTitle className="text-lg">Verified Carrier Registry</CardTitle>
              <CardDescription>Platform-authorized logistics partners.</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input placeholder="Search carriers..." className="pl-8 h-8 text-xs w-48" />
              </div>
            </div>
          </CardHeader>
          <ScrollArea className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Carrier ID</TableHead>
                  <TableHead className="font-bold">Partner Name</TableHead>
                  <TableHead className="font-bold">Mode</TableHead>
                  <TableHead className="font-bold">Fleet Size</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carriers.map((car) => (
                  <TableRow key={car.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="font-mono text-xs font-bold text-slate-400">{car.id}</TableCell>
                    <TableCell className="font-bold text-slate-900">{car.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-bold">{car.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{car.fleet} Units</TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[9px] font-bold",
                        car.status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>{car.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="font-bold text-primary gap-2">
                        Audit <Settings2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Globe className="h-48 w-48" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Port Control Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              {[
                { port: "Rotterdam, NL", status: "Optimal", ping: "Green" },
                { port: "Shanghai, CN", status: "Congested", ping: "Amber" },
                { port: "Durban, ZA", status: "Optimal", ping: "Green" },
                { port: "Santos, BR", status: "Maintenance", ping: "Red" },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      p.ping === "Green" ? "bg-emerald-500 animate-pulse" : 
                      p.ping === "Amber" ? "bg-amber-500" : "bg-rose-500"
                    )} />
                    <span className="text-xs font-bold">{p.port}</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-60 uppercase">{p.status}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold h-11 text-xs">
                Global Network Map
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">IncoTerms Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                98.4% of active shipments are using ICC 2020 Standard IncoTerms. 3 anomalies detected in CIF contracts.
              </p>
              <Button variant="ghost" className="w-full text-[10px] font-bold text-primary group uppercase">
                Review Anomalies <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
