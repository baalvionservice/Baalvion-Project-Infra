"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe,
  ShieldCheck,
  ChevronRight,
  RefreshCcw,
  Zap,
  Building2,
  Database,
  Lock,
  Flag,
  Info,
  Settings,
  MoreVertical,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/**
 * Global Matrix Hub: Tactical Layer 2.
 * Management of market hubs, jurisdictional logic, and cross-market sync.
 */
export default function GlobalMatrixHub() {
  const {
    countryConfigs,
    setCountryEnabled,
    globalSyncHistory,
    executeSafeSync,
    adminJurisdiction,
  } = useAppStore();

  const [isSyncModalOpen, setIsSyncOpen] = useState(false);

  const handleToggleHub = (code: any, enabled: boolean) => {
    setCountryEnabled(code, enabled);
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      {/* Safe Sync Authorization */}
      <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncOpen}>
        <DialogContent className="max-w-xl bg-white border-none shadow-2xl rounded-none p-0 overflow-hidden">
          <div className="p-10 space-y-8">
            <div className="flex items-center space-x-4 text-plum">
              <Zap className="w-6 h-6" />
              <h3 className="text-2xl font-headline font-bold italic uppercase tracking-widest text-gray-900">
                Global Master Sync
              </h3>
            </div>
            <p className="text-sm text-gray-500 font-light italic leading-relaxed">
              "Authorizing a Master Sync will override regional registry nodes
              with the Paris Central Archive. This action is irreversible once
              committed to the ledger."
            </p>
            <div className="pt-6 flex justify-end space-x-4">
              <Button
                variant="ghost"
                onClick={() => setIsSyncOpen(false)}
                className="rounded-none text-[10px] font-bold uppercase"
              >
                Cancel
              </Button>
              <Button
                className="bg-black text-white hover:bg-plum rounded-none h-12 px-10 font-bold uppercase tracking-widest transition-all"
                onClick={() =>
                  executeSafeSync(["products"], ["us", "ae", "uk", "in", "sg"])
                }
              >
                AUTHORIZE MASTER SYNC
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
            <Globe className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              Tactical Layer 2
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            Global Matrix
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Orchestrating jurisdictional nodes and cross-market synchronization.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            className="h-14 px-10 rounded-none bg-blue-600 text-white hover:bg-blue-500 transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/20"
            onClick={() => setIsSyncOpen(true)}
          >
            <Zap className="w-4 h-4 mr-3" /> INITIATE MASTER SYNC
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Market Hub Matrix */}
        <div className="lg:col-span-8 space-y-12">
          <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden rounded-none">
            <CardHeader className="border-b border-white/5 bg-white/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl text-white italic">
                  Jurisdictional Nodes
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                  Active market hubs and settlement logic
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="text-[8px] border-white/10 text-white/40 uppercase"
              >
                5 Nodes Registered
              </Badge>
            </CardHeader>
            <div className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                      Market Hub
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">
                      Currency & FX
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">
                      Tax Protocol
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                      Hub Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {countryConfigs.map((c) => (
                    <TableRow
                      key={c.code}
                      className="hover:bg-white/5 transition-colors border-white/5 h-20"
                    >
                      <TableCell className="pl-8">
                        <div className="flex items-center space-x-4">
                          <span className="text-xl">{c.symbol}</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white uppercase tracking-widest">
                              {c.name} Hub
                            </span>
                            <span className="text-[8px] text-white/20 font-mono">
                              NODE_{c.code.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-bold text-white/60 tabular">
                          {c.currency}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[7px] border-white/10 text-plum uppercase"
                        >
                          {c.taxType} / {c.taxRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Switch
                          checked={c.enabled}
                          onCheckedChange={(val) =>
                            handleToggleHub(c.code, val)
                          }
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="bg-[#111113] border-white/5 shadow-2xl overflow-hidden rounded-none">
            <CardHeader className="border-b border-white/5 bg-white/5 p-8 flex flex-row items-center justify-between">
              <CardTitle className="font-headline text-2xl text-white italic">
                Sync History
              </CardTitle>
              <Link href="/admin/audit">
                <Button
                  variant="ghost"
                  className="text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white"
                >
                  View Full Audit <ArrowRight className="w-3 h-3 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 h-10">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Actor
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40 text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    ID
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalSyncHistory.map((sync) => (
                  <TableRow
                    key={sync.id}
                    className="border-white/5 hover:bg-white/[0.02] h-12"
                  >
                    <TableCell className="pl-8 text-[9px] font-mono text-white/20">
                      {new Date(sync.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-white/60 uppercase">
                      {sync.actorName}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-[7px] border-none bg-emerald-500/10 text-emerald-400 uppercase"
                      >
                        {sync.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 font-mono text-[9px] text-white/10">
                      {sync.id}
                    </TableCell>
                  </TableRow>
                ))}
                {globalSyncHistory.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-20 text-center opacity-20"
                    >
                      <RefreshCcw className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">
                        No Master Sync Events Recorded
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        <aside className="lg:col-span-4 space-y-8">
          <Card className="bg-black text-white p-10 space-y-10 shadow-2xl relative overflow-hidden rounded-none border-none">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-40 h-40 text-blue-500" />
            </div>
            <div className="relative z-10 space-y-6">
              <h3 className="text-3xl font-headline font-bold italic tracking-tight leading-none">
                Hub Isolation Protocol
              </h3>
              <p className="text-sm font-light italic text-white/60 leading-relaxed">
                "Identity and data isolation are active across all hubs. No data
                leakage detected between UAE and US registry nodes."
              </p>
              <div className="space-y-6 pt-6 border-t border-white/10">
                <PolicyNode label="Cross-Market Access" val="BLOCKED" />
                <PolicyNode label="Global View Mode" val="ENABLED" />
                <PolicyNode label="Audit Integrity" val="100%" />
              </div>
            </div>
          </Card>

          <Card className="bg-[#111113] border-white/5 p-8 space-y-6 rounded-none">
            <div className="flex items-center space-x-3 text-gold">
              <Flag className="w-4 h-4" />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">
                Compliance Signal
              </h4>
            </div>
            <p className="text-[10px] text-white/40 italic leading-relaxed">
              "Hub logic for India (GST 18%) and UAE (VAT 5%) is synchronized
              with jurisdictional tax authorities."
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function PolicyNode({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 pb-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
        {label}
      </span>
      <span className="text-sm font-bold text-white tabular uppercase">
        {val}
      </span>
    </div>
  );
}

function StatsTile({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <Card className="bg-[#111113] border-white/5 shadow-xl p-8 space-y-4 group hover:border-blue-600/40 transition-all rounded-none">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/20 group-hover:text-blue-400 transition-colors">
          {label}
        </span>
        <Badge
          variant="outline"
          className="text-[8px] uppercase border-blue-600/20 text-blue-400 rounded-none bg-blue-600/5"
        >
          {trend}
        </Badge>
      </div>
      <div className="text-4xl font-headline font-bold italic text-white/90 group-hover:text-white">
        {value}
      </div>
    </Card>
  );
}
