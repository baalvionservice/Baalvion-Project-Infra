"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/design-system/typography/text";
import {
  Package,
  Search,
  Filter,
  Loader2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Database,
  Globe,
  Plus,
  ChevronRight,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

export default function VendorManagementHub() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Mock Vendor Matrix
  const [vendors, setVendors] = useState([
    {
      id: "v-1",
      name: "MarketData Pro",
      type: "Data Provider",
      creditScore: 94,
      status: "Verified",
      compliance: "Nominal",
    },
    {
      id: "v-2",
      name: "SocialPulse API",
      type: "Sentiment Service",
      creditScore: 82,
      status: "Pending",
      compliance: "Under Review",
    },
    {
      id: "v-3",
      name: "ExpertWire",
      type: "Contributor Agency",
      creditScore: 78,
      status: "Verified",
      compliance: "Nominal",
    },
    {
      id: "v-4",
      name: "AlphaStream",
      type: "Liquidity Provider",
      creditScore: 91,
      status: "Verified",
      compliance: "Critical",
    },
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 700);
  }, []);

  const handleDecision = (id: string, action: "Approve" | "Reject") => {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, status: action === "Approve" ? "Verified" : "Rejected" }
          : v
      )
    );
    toast({
      title: "Compliance Verdict",
      description: `Vendor handshake ${action.toLowerCase()}ed and logged.`,
    });
  };

  const handleAction = (action: string) => {
    toast({
      title: "Action Initiated",
      description: `${action} process started.`,
    });
  };

  const getComplianceBadge = (level: string) => {
    switch (level) {
      case "Nominal":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-bold text-[8px] uppercase">
            Nominal
          </Badge>
        );
      case "Critical":
        return (
          <Badge className="bg-destructive/10 text-destructive border-none font-bold text-[8px] uppercase animate-pulse">
            Critical Anomaly
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[8px] font-bold uppercase">
            {level}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Package className="h-4 w-4" />
            <Text
              variant="label"
              className="text-[10px] font-bold tracking-widest uppercase"
            >
              External Supply Node
            </Text>
          </div>
          <Text variant="h1" className="text-3xl font-bold tracking-tight">
            Vendor Ecosystem
          </Text>
        </div>
        <Button className="rounded-xl shadow-lg shadow-primary/20 font-bold bg-primary hover:bg-primary/90 h-11 px-8 transition-all scale-105 active:scale-95">
          <Plus className="mr-2 h-4 w-4" /> Provision New Vendor
        </Button>
      </header>

      {/* Top Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Active Vendors",
            value: "42",
            icon: Database,
            color: "text-primary",
          },
          {
            label: "Avg. Credit Node",
            value: "88.4",
            icon: TrendingUp,
            color: "text-secondary",
          },
          {
            label: "Pending Audits",
            value: "5",
            icon: AlertCircle,
            color: "text-amber-500",
          },
          {
            label: "Global Compliance",
            value: "94%",
            icon: ShieldCheck,
            color: "text-emerald-500",
          },
        ].map((v) => (
          <Card
            key={v.label}
            className="glass-card border-none shadow-xl group"
          >
            <CardContent className="p-6 flex items-center gap-5">
              <div
                className={cn(
                  "p-3 rounded-2xl bg-background/50 border border-white/5 transition-transform group-hover:scale-110",
                  v.color
                )}
              >
                <v.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold tracking-tight">
                  {v.value}
                </div>
                <Text
                  variant="label"
                  className="text-[9px] opacity-50 uppercase font-bold tracking-widest"
                >
                  {v.label}
                </Text>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card border-none shadow-2xl overflow-hidden">
        <CardHeader className="bg-card/30 border-b border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-xl">Supply Handshake Matrix</CardTitle>
            <CardDescription>
              Auditing third-party data nodes and service integrations.
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter by vendor ID or type..."
              className="pl-10 h-11 bg-background/50 border-white/10 rounded-xl text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 border-b border-white/5">
                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest py-6">
                  Vendor Hub
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest">
                  Classification
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Credit Node
                </TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">
                  Compliance
                </TableHead>
                <TableHead className="text-right pr-8 font-bold text-[10px] uppercase tracking-widest">
                  Decision
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors
                .filter((v) =>
                  v.name.toLowerCase().includes(search.toLowerCase())
                )
                .map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    className="group hover:bg-white/5 transition-colors border-b border-white/5"
                  >
                    <TableCell className="py-5 pl-8">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">
                          {vendor.name}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono uppercase mt-1">
                          ID: {vendor.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[8px] font-bold uppercase border-white/10 bg-black/20 px-2 h-5"
                      >
                        {vendor.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            "text-xs font-bold font-mono",
                            vendor.creditScore > 85
                              ? "text-emerald-500"
                              : "text-amber-500"
                          )}
                        >
                          {vendor.creditScore}
                        </span>
                        <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              vendor.creditScore > 85
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            )}
                            style={{ width: `${vendor.creditScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        {getComplianceBadge(vendor.compliance)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        {vendor.status === "Pending" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-xl text-[10px] font-bold uppercase text-emerald-500 hover:bg-emerald-500/10"
                              onClick={() =>
                                handleDecision(vendor.id, "Approve")
                              }
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Verify
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-xl text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10"
                              onClick={() =>
                                handleDecision(vendor.id, "Reject")
                              }
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Deny
                            </Button>
                          </>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border-none text-[8px] font-bold uppercase h-6 px-3"
                          >
                            {vendor.status}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="glass-card border-none bg-primary/5 p-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
          <div className="w-20 h-20 rounded-[2.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-2xl shrink-0">
            <Globe className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center lg:text-left space-y-2">
            <Text variant="h2" className="text-2xl font-bold">
              Supply Chain Integrity
            </Text>
            <Text
              variant="bodySmall"
              className="text-muted-foreground leading-relaxed max-w-2xl"
            >
              All data vendors are benchmarked against the **Institutional
              Compliance Matrix**. Quarterly audits are enforced for all nodes
              providing real-time market wires or PII processing.
            </Text>
          </div>
          <Button
            variant="outline"
            className="h-12 px-8 rounded-xl font-bold border-primary/30 hover:bg-primary/5 shrink-0"
            onClick={() => handleAction("Audit Contracts")}
          >
            Audit All Contracts
          </Button>
        </div>
      </Card>
    </div>
  );
}
