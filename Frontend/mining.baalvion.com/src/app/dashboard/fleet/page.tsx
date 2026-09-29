"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Truck, 
  Settings, 
  MapPin, 
  Activity, 
  Plus, 
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function FleetManagement() {
  const [fleet] = useState([
    { id: "T-882", type: "Tipping Truck", cap: "40 MT", status: "AVAILABLE", loc: "Durban, ZA", health: "98%" },
    { id: "V-001", type: "Bulk Carrier", cap: "50,000 MT", status: "IN_TRANSIT", loc: "Indian Ocean", health: "92%" },
    { id: "R-912", type: "Rail Wagon Set", cap: "200 MT", status: "MAINTENANCE", loc: "Beira, MZ", health: "45%" },
    { id: "T-885", type: "Tipping Truck", cap: "40 MT", status: "AVAILABLE", loc: "Johannesburg, ZA", health: "95%" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Fleet Management</h1>
          <p className="text-muted-foreground mt-1">Register and monitor transport units across all modes.</p>
        </div>
        <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2">
          <Plus className="h-4 w-4" /> Register Asset
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search units by ID, Type or Location..." className="pl-10" />
        </div>
        <Button variant="outline" className="gap-2"><Settings className="h-4 w-4" /> Filters</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {fleet.map((unit) => (
          <Card key={unit.id} className="border-none shadow-sm hover:shadow-md transition-shadow group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <Badge 
                variant={unit.status === "AVAILABLE" ? "default" : "secondary"}
                className={cn(
                  "text-[10px] font-bold uppercase",
                  unit.status === "AVAILABLE" && "bg-emerald-500 hover:bg-emerald-600",
                  unit.status === "MAINTENANCE" && "bg-rose-500 hover:bg-rose-600"
                )}
              >
                {unit.status.replace('_', ' ')}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h3 className="font-bold text-lg">{unit.id}</h3>
                <p className="text-xs text-muted-foreground">{unit.type} • {unit.cap}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {unit.loc}
              </div>

              <div className="pt-4 border-t space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-blue-500" />
                    <span>Unit Health</span>
                  </div>
                  <span className={cn(
                    "font-bold",
                    parseInt(unit.health) > 90 ? "text-emerald-600" : "text-amber-600"
                  )}>{unit.health}</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full",
                      parseInt(unit.health) > 90 ? "bg-emerald-500" : "bg-amber-500"
                    )} 
                    style={{ width: unit.health }} 
                  />
                </div>
              </div>

              <Button variant="ghost" className="w-full text-[10px] font-bold h-8 group-hover:bg-primary group-hover:text-white transition-all">
                Full Telemetry
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Maintenance Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-rose-100">
              <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
              <div>
                <p className="text-sm font-bold text-rose-700">Service Required: R-912</p>
                <p className="text-xs text-rose-600">Wheel assembly inspection overdue. Unit grounded until cleared.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">Compliance Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              "Global Transit Insurance: Active",
              "Transport Safety Permit: Verified",
              "Hazmat Certification: Renewed"
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {check}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
