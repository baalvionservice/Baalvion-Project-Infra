
"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Search, 
  Filter, 
  Download, 
  History, 
  ShieldCheck, 
  MapPin, 
  Boxes,
  MoreVertical,
  Gem,
  Tag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function WarehouseInventory() {
  const [stock] = useState([
    { id: "B-9921", material: "Iron Ore Fine", owner: "Global Mining Inc.", qty: "12,500 MT", zone: "Zone B-1", status: "VERIFIED" },
    { id: "B-9925", material: "Copper Cathodes", owner: "Zambia Copper", qty: "2,000 MT", zone: "Silo 3", status: "VERIFIED" },
    { id: "B-9930", material: "Lithium Spodumene", owner: "Atlas Mining", qty: "850 MT", zone: "Zone A-2", status: "QUARANTINED" },
    { id: "B-9935", material: "Manganese", owner: "South Trade", qty: "5,000 MT", zone: "Yard 4", status: "VERIFIED" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Inventory Control</h1>
          <p className="text-muted-foreground mt-1">Real-time stock tracking by batch, owner, and storage zone.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><History className="h-4 w-4" /> Stock History</Button>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
            <Download className="h-4 w-4" /> Export Inventory Report
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by Batch ID, Owner, or Material..." className="pl-10" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2"><Filter className="h-4 w-4" /> Filters</Button>
          <div className="h-8 w-px bg-border mx-2" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">Storage Certified</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {[
          { label: "Total Batches", val: "142", icon: Tag },
          { label: "Net Weight", val: "41,200 MT", icon: Boxes },
          { label: "Active Owners", val: "18", icon: Gem },
          { label: "Occupied Zones", val: "12 / 15", icon: MapPin },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</p>
                <p className="text-lg font-bold text-primary">{stat.val}</p>
              </div>
              <stat.icon className="h-5 w-5 text-muted-foreground/30" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Batch ID</TableHead>
              <TableHead className="font-bold">Material / Owner</TableHead>
              <TableHead className="font-bold">Quantity</TableHead>
              <TableHead className="font-bold">Location</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stock.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/20">
                <TableCell className="font-bold text-primary">{item.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.material}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{item.owner}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold">{item.qty}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {item.zone}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === "VERIFIED" ? "default" : "secondary"} className={cn(
                    "text-[10px] font-bold",
                    item.status === "VERIFIED" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600"
                  )}>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import { cn } from "@/lib/utils";
