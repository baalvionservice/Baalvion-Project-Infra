"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Globe,
  ShieldAlert,
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  BadgeCheck,
  Ban,
  FileText,
  DollarSign,
  TrendingUp,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Trash2,
  Settings2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AdminTradeControlPage() {
  const { toast } = useToast();
  const [countries, setCountries] = useState([
    {
      code: "AU",
      name: "Australia",
      region: "Asia Pacific",
      export: true,
      status: "Active",
    },
    {
      code: "BR",
      name: "Brazil",
      region: "South America",
      export: true,
      status: "Active",
    },
    {
      code: "CN",
      name: "China",
      region: "Asia Pacific",
      export: false,
      status: "Active",
    },
    {
      code: "ZA",
      name: "South Africa",
      region: "Africa",
      export: true,
      status: "Active",
    },
    {
      code: "IN",
      name: "India",
      region: "Asia Pacific",
      export: true,
      status: "Active",
    },
  ]);

  const [tradeRules, setTradeRules] = useState([
    {
      id: "TR-001",
      from: "Australia",
      to: "China",
      mineral: "Iron Ore",
      status: "ALLOWED",
      docs: 3,
    },
    {
      id: "TR-002",
      from: "Brazil",
      to: "Europe",
      mineral: "Bauxite",
      status: "ALLOWED",
      docs: 4,
    },
    {
      id: "TR-003",
      from: "Russia",
      to: "USA",
      mineral: "All",
      status: "PROHIBITED",
      docs: 0,
    },
  ]);

  const handleToggleExport = (code: string) => {
    setCountries((prev) =>
      prev.map((c) => (c.code === code ? { ...c, export: !c.export } : c))
    );
    toast({
      title: "Eligibility Updated",
      description: `Export status for ${code} has been modified globally.`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-slate-900 flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Global Trade Control
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Manage international trade rules, export eligibility, and
            cross-border currency compliance.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="gap-2 border-slate-300 h-12 px-6 font-bold"
          >
            <Landmark className="h-4 w-4" /> Global Policy
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white font-bold gap-2 shadow-lg h-12 px-8">
                <Plus className="h-4 w-4" /> Create Trade Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <ArrowLeftRight className="h-6 w-6 text-primary" />
                  Define Border Protocol
                </DialogTitle>
                <DialogDescription>
                  Set mineral-specific restrictions between origin and
                  destination countries.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-6 border-y my-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">
                      Origin Country
                    </Label>
                    <Select>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest">
                      Destination Region
                    </Label>
                    <Select>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eu">Europe</SelectItem>
                        <SelectItem value="cn">China</SelectItem>
                        <SelectItem value="us">USA</SelectItem>
                        <SelectItem value="apac">Asia Pacific</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">
                    Restricted Mineral
                  </Label>
                  <Select>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select Mineral Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iron">Iron Ore</SelectItem>
                      <SelectItem value="lith">Lithium</SelectItem>
                      <SelectItem value="co">Cobalt</SelectItem>
                      <SelectItem value="all">All Minerals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest">
                    Permission Level
                  </Label>
                  <Select defaultValue="allowed">
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allowed">
                        ALLOWED (Verification Req)
                      </SelectItem>
                      <SelectItem value="restricted">
                        RESTRICTED (Admin Approval)
                      </SelectItem>
                      <SelectItem value="prohibited">
                        PROHIBITED (Block Order)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button variant="outline" className="font-bold">
                  Cancel
                </Button>
                <Button
                  className="bg-primary px-8 font-bold"
                  onClick={() =>
                    toast({
                      title: "Rule Created",
                      description: "Global trade matrix updated.",
                    })
                  }
                >
                  Publish Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {[
          {
            label: "Active Regions",
            val: "06",
            icon: MapPin,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Trade Restrictions",
            val: tradeRules
              .filter((r) => r.status === "PROHIBITED")
              .length.toString(),
            icon: ShieldAlert,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
          {
            label: "Exporting Ready",
            val: countries.filter((c) => c.export).length.toString(),
            icon: BadgeCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "FX Settlements",
            val: "12",
            icon: DollarSign,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {stat.val}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="countries" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 h-auto gap-1">
          <TabsTrigger value="countries" className="px-8 py-2.5 font-bold">
            Country Registry
          </TabsTrigger>
          <TabsTrigger value="rules" className="px-8 py-2.5 font-bold">
            Cross-Border Rules
          </TabsTrigger>
          <TabsTrigger value="currency" className="px-8 py-2.5 font-bold">
            FX & Rates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search registry..."
                    className="pl-10 h-10 border-slate-200"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 h-10 border-slate-200"
                >
                  <Filter className="h-4 w-4" /> Filter Regions
                </Button>
              </div>
              <Badge
                variant="outline"
                className="bg-white border-slate-200 font-bold px-3 py-1"
              >
                5 Verified Regions
              </Badge>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Code</TableHead>
                  <TableHead className="font-bold">Country Name</TableHead>
                  <TableHead className="font-bold">Trade Region</TableHead>
                  <TableHead className="font-bold">
                    Export Eligibility
                  </TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">
                    Control
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map((c) => (
                  <TableRow
                    key={c.code}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <TableCell className="font-mono font-bold text-slate-400 group-hover:text-primary transition-colors">
                      {c.code}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {c.name}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-slate-600">
                      {c.region}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleExport(c.code)}
                        className={cn(
                          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all active:scale-95",
                          c.export
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        )}
                      >
                        {c.export ? (
                          <BadgeCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        {c.export ? "Eligible" : "Restricted"}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[9px] font-bold"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-primary"
                      >
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-lg">
                  Permission Logic Matrix
                </CardTitle>
                <CardDescription>
                  Rules governing automated trade blocks and document
                  checklists.
                </CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Origin → Dest</TableHead>
                    <TableHead className="font-bold">Mineral Group</TableHead>
                    <TableHead className="font-bold">Permission</TableHead>
                    <TableHead className="font-bold">
                      Req. Documentation
                    </TableHead>
                    <TableHead className="text-right font-bold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeRules.map((r) => (
                    <TableRow
                      key={r.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          {r.from}{" "}
                          <ArrowLeftRight className="h-3 w-3 text-slate-400" />{" "}
                          {r.to}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-600">
                        {r.mineral}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5",
                            r.status === "ALLOWED"
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                              : "bg-rose-100 text-rose-700 hover:bg-rose-100"
                          )}
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-primary">
                        {r.docs > 0 ? `${r.docs} Standard Docs` : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-primary transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-rose-500 transition-colors"
                            onClick={() =>
                              setTradeRules((prev) =>
                                prev.filter((x) => x.id !== r.id)
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute right-0 bottom-0 p-8 opacity-10">
                <ShieldCheck className="h-48 w-48" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">
                  Compliance Logic Center
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10 pt-2">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5" /> Auto-Block Protocol
                  </p>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                    "High-Risk" regions automatically trigger mandatory Tier 3
                    director identity verification before order release.
                  </p>
                </div>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Master Rule Sync</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Optimal
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Blocked Attempts (24h)
                    </span>
                    <span className="font-bold text-rose-400">04 Critical</span>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-lg border-none mt-4">
                  Sync Global Sanctions Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle>Trade Settlement Currencies</CardTitle>
              <CardDescription>
                Configure live conversion rates for international marketplace
                settlement (Base: USD).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { cur: "EUR", rate: "0.92", change: "+0.2%", up: true },
                  { cur: "INR", rate: "83.15", change: "-0.5%", up: false },
                  { cur: "AED", rate: "3.67", change: "0.0%", up: true },
                  { cur: "ZAR", rate: "18.95", change: "+1.2%", up: true },
                  { cur: "AUD", rate: "1.52", change: "-0.1%", up: false },
                  { cur: "SGD", rate: "1.34", change: "+0.1%", up: true },
                ].map((c) => (
                  <div
                    key={c.cur}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all cursor-pointer"
                  >
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {c.cur} / USD
                      </p>
                      <p className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                        {c.rate}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                        c.up
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      )}
                    >
                      <TrendingUp
                        className={cn("h-3 w-3", !c.up && "rotate-180")}
                      />
                      {c.change}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t flex justify-between items-center">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                  <Clock className="h-3.5 w-3.5" /> Latest update: 4 mins ago
                  via Reuters Index
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary font-bold gap-2"
                >
                  Update Rates Manually <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
