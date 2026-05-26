"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Target,
  Users,
  Crown,
  MessageSquare,
  ChevronRight,
  Search,
  Filter,
  TrendingUp,
  Award,
  Lock,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileText,
  BadgeDollarSign,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/use-search";

/**
 * Connoisseur CRM: Strategic Engagement Hub
 * Tab 1: Overview (Tier 1 Priority), Tab 2: Dialogue Hub, Tab 3: Curatorial Scripts
 */
export default function AdminSalesHub() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { scopedInquiries, updateInquiryStatus, currentUser } = useAppStore();

  const filteredLeads = useSearch(scopedInquiries, searchQuery, {
    status: statusFilter,
  });

  const priorityLeads = useMemo(() => {
    return scopedInquiries
      .filter((i) => i.leadTier === 1 && i.status === "new")
      .slice(0, 3);
  }, [scopedInquiries]);

  const selectedLead = useMemo(
    () => scopedInquiries.find((i) => i.id === selectedLeadId),
    [scopedInquiries, selectedLeadId]
  );

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
            <Link href="/admin">Dashboard</Link>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-plum">Engagement CRM</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">
            Sales CRM
          </h1>
          <p className="text-sm text-gray-500 font-light italic">
            High-ticket curatorial dialogue & acquisition tracking.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="h-14 px-10 rounded-none bg-plum text-white hover:bg-black transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-plum/20">
            <Plus className="w-4 h-4 mr-3" /> REGISTER NEW CONNOISSEUR
          </Button>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border-b border-border h-14 w-full justify-start p-0 rounded-none space-x-12 mb-12">
          <TabsTrigger value="overview" className="tab-trigger">
            Strategic Overview
          </TabsTrigger>
          <TabsTrigger value="dialogue" className="tab-trigger">
            Dialogue Hub
          </TabsTrigger>
          <TabsTrigger value="advanced" className="tab-trigger">
            Curatorial Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-12 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card className="bg-white border-border shadow-luxury p-8 border-l-4 border-l-gold space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Yield Pipeline
                </span>
                <BadgeDollarSign className="w-5 h-5 text-gold" />
              </div>
              <div className="text-4xl font-headline font-bold italic text-gray-900">
                $2.4M
              </div>
              <p className="text-[10px] text-gray-400 italic">
                Total value of open acquisitions.
              </p>
            </Card>
            <Card className="bg-white border-border shadow-luxury p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Tier 1 Resonance
                </span>
                <Crown className="w-5 h-5 text-plum" />
              </div>
              <div className="text-4xl font-headline font-bold italic text-gray-900">
                {priorityLeads.length}
              </div>
              <p className="text-[10px] text-gray-400 italic">
                Institutional connoisseurs awaiting first contact.
              </p>
            </Card>
            <Card className="bg-white border-border shadow-luxury p-8 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Conversion Rate
                </span>
                <TrendingUp className="w-5 h-5 text-plum" />
              </div>
              <div className="text-4xl font-headline font-bold italic text-gray-900">
                12.4%
              </div>
              <p className="text-[10px] text-gray-400 italic">
                Acquisition win-rate across the global registry.
              </p>
            </Card>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-plum">
              IMMEDIATE ACTION REQUIRED
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {priorityLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-8 bg-white border border-border shadow-sm flex items-center justify-between hover:border-plum transition-all group"
                >
                  <div className="flex items-center space-x-8">
                    <div className="w-14 h-14 bg-plum/5 border border-plum/10 rounded-full flex items-center justify-center font-headline text-2xl font-bold text-plum">
                      {lead.customerName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg font-headline font-bold uppercase tracking-tight">
                        {lead.customerName}
                      </h4>
                      <p className="text-xs text-gray-400 italic">
                        {lead.intent} Inquiry • {lead.country} Hub
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-12">
                    <div className="text-right">
                      <p className="text-[9px] font-bold uppercase text-gray-400 tracking-widest">
                        Bracket
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {lead.budgetRange}
                      </p>
                    </div>
                    <Button
                      className="h-12 px-8 rounded-none bg-black text-white hover:bg-plum transition-all text-[10px] font-bold uppercase tracking-widest"
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      START DIALOGUE
                    </Button>
                  </div>
                </div>
              ))}
              {priorityLeads.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-border flex flex-col items-center space-y-4 opacity-30">
                  <CheckCircle2 className="w-12 h-12" />
                  <p className="text-sm font-bold uppercase tracking-widest italic">
                    All Tier 1 dialogues are currently optimized.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="dialogue" className="animate-fade-in space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <Card className="lg:col-span-7 bg-white border-border shadow-luxury overflow-hidden">
              <CardHeader className="border-b border-border flex justify-between items-center bg-ivory/10">
                <div>
                  <CardTitle className="font-headline text-2xl">
                    Acquisition Registry
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest">
                    Global flow of connoisseur intent
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                  <input
                    className="bg-white border border-border h-10 pl-10 pr-4 text-[9px] font-bold uppercase tracking-widest outline-none w-48 focus:ring-1 focus:ring-plum transition-all"
                    placeholder="FILTER..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <Table>
                <TableHeader className="bg-ivory/50">
                  <TableRow>
                    <TableHead className="text-[9px] uppercase font-bold pl-8">
                      Connoisseur
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-center">
                      Tier
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold">
                      Status
                    </TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                      Context
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className={cn(
                        "hover:bg-ivory/30 cursor-pointer transition-colors",
                        selectedLeadId === lead.id && "bg-plum/5"
                      )}
                      onClick={() => setSelectedLeadId(lead.id)}
                    >
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-tight">
                            {lead.customerName}
                          </span>
                          <span className="text-[8px] text-gray-400 uppercase font-mono">
                            {lead.country}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={cn(
                            "inline-flex items-center justify-center w-6 h-6 rounded-full text-[9px] font-bold border",
                            lead.leadTier === 1
                              ? "bg-gold/10 border-gold text-gold"
                              : "bg-gray-50 text-gray-400"
                          )}
                        >
                          {lead.leadTier}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-[8px] uppercase tracking-widest"
                        >
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <ChevronRight className="w-4 h-4 ml-auto text-gray-200" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <div className="lg:col-span-5 space-y-8">
              {selectedLead ? (
                <Card className="bg-white border-border shadow-luxury overflow-hidden">
                  <CardHeader className="border-b border-border bg-plum/5">
                    <CardTitle className="font-headline text-xl uppercase italic">
                      {selectedLead.customerName}
                    </CardTitle>
                    <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-plum">
                      Maison Dialogue Active
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-10">
                    <div className="space-y-4">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Acquisition Stage
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          "contacted",
                          "qualifying",
                          "presenting",
                          "closing",
                          "won",
                        ].map((stage) => (
                          <Button
                            key={stage}
                            variant={
                              selectedLead.status === stage
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className="h-8 rounded-none text-[8px] font-bold uppercase tracking-widest"
                            onClick={() =>
                              updateInquiryStatus(selectedLead.id, stage as any)
                            }
                          >
                            {stage}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button
                      className="w-full h-14 bg-black text-white hover:bg-plum rounded-none text-[10px] font-bold uppercase tracking-widest"
                      asChild
                    >
                      <Link
                        href={`/${selectedLead.country.toLowerCase()}/inquiry/${
                          selectedLead.id
                        }`}
                      >
                        OPEN SECURE TERMINAL
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="py-40 text-center border-2 border-dashed border-border flex flex-col items-center space-y-4 opacity-20">
                  <MessageSquare className="w-12 h-12" />
                  <p className="text-sm font-bold uppercase tracking-widest italic">
                    Select a connoisseur to begin dialogue.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="animate-fade-in space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Card className="bg-white border-border shadow-luxury p-10 space-y-8">
              <div className="flex items-center space-x-4 text-plum">
                <FileText className="w-6 h-6" />
                <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest">
                  Curatorial Scripts
                </h3>
              </div>
              <p className="text-sm text-gray-500 font-light italic leading-relaxed">
                Manage the artisanal narrative templates used by AI Sales Agents
                and human curators to maintain Maison principles.
              </p>
              <Button
                variant="outline"
                className="w-full h-12 border-border text-[9px] font-bold uppercase tracking-widest hover:bg-black hover:text-white"
                asChild
              >
                <Link href="/admin/messaging">MANAGE TEMPLATES</Link>
              </Button>
            </Card>

            <Card className="bg-white border-border shadow-luxury p-10 space-y-8">
              <div className="flex items-center space-x-4 text-plum">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="text-xl font-headline font-bold italic uppercase tracking-widest">
                  Dialogue Security
                </h3>
              </div>
              <p className="text-sm text-gray-500 font-light italic leading-relaxed">
                Configure end-to-end encryption protocols and archival
                requirements for global high-ticket negotiations.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Institutional Audit Active
                </span>
                <Switch
                  defaultChecked
                  className="data-[state=checked]:bg-plum"
                />
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RevenueNavItem({
  icon,
  label,
  active,
}: {
  icon: any;
  label: string;
  active: boolean;
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center space-x-4 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all group rounded-sm border",
        active
          ? "bg-plum text-white border-plum shadow-md"
          : "text-gray-400 hover:bg-ivory hover:text-plum border-transparent"
      )}
    >
      <span
        className={cn(
          "transition-transform group-hover:scale-110",
          active ? "text-white" : "text-gold"
        )}
      >
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: "w-5 h-5",
        })}
      </span>
      <span>{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  positive,
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  positive: boolean;
}) {
  return (
    <Card className="bg-white border-border shadow-luxury hover:border-gold transition-colors group">
      <CardContent className="p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div className="p-4 bg-ivory rounded-full group-hover:bg-gold/10 transition-colors text-plum">
            {icon}
          </div>
          <div
            className={cn(
              "flex items-center text-[10px] font-bold tracking-widest uppercase",
              positive ? "text-gold" : "text-gray-400"
            )}
          >
            {trend}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-[10px] uppercase tracking-[0.4em] font-bold">
            {label}
          </div>
          <div className="text-4xl font-headline font-bold italic mt-2 text-gray-900">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
