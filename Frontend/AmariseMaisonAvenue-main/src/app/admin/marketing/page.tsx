"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Target,
  Mail,
  Crown,
  BarChart3,
  LogOut,
  ChevronRight,
  Plus,
  RefreshCcw,
  TrendingUp,
  Users,
  LayoutDashboard,
  Smartphone,
  Briefcase,
  Megaphone,
  Network,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Tag,
  Save,
  Clock,
  Edit3,
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
import { useAppStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Campaign } from "@/lib/types";

type MarketingTab =
  | "dashboard"
  | "campaigns"
  | "verification"
  | "segments"
  | "affiliates"
  | "subscriptions"
  | "communications"
  | "loyalty"
  | "analytics";

export default function MarketingAdminPanel() {
  const [activeTab, setActiveTab] = useState<MarketingTab>("dashboard");
  const {
    activeCampaigns,
    affiliates,
    vipClients,
    verifyClient,
    upsertCampaign,
  } = useAppStore();
  const { toast } = useToast();

  const [isCampaignEditorOpen, setIsCampaignEditorOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const handleCreateFlashSale = () => {
    setEditingCampaign({
      id: `camp-${Date.now()}`,
      title: "New Flash Sale Event",
      type: "Flash Sale",
      status: "scheduled",
      discountValue: 15,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      market: "global",
      reach: 0,
      conversions: 0,
      roi: 0,
      predictedRoi: 0,
      abTestActive: false,
      brandId: "amarise-luxe",
    });
    setIsCampaignEditorOpen(true);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCampaign) {
      upsertCampaign(editingCampaign);
      setIsCampaignEditorOpen(false);
      setEditingCampaign(null);
      toast({
        title: "Campaign Authorized",
        description:
          "The flash sale has been registered in the global engagement matrix.",
      });
    }
  };

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-plum text-xs font-normal tracking-[0.4em] ml-2">
              ENGAGE
            </span>
          </div>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            Maison Marketing Hub
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <MarketingNavItem
            icon={<LayoutDashboard />}
            label="Engagement"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <MarketingNavItem
            icon={<Zap />}
            label="Campaigns"
            active={activeTab === "campaigns"}
            onClick={() => setActiveTab("campaigns")}
          />
          <MarketingNavItem
            icon={<UserCheck />}
            label="Client Verification"
            active={activeTab === "verification"}
            onClick={() => setActiveTab("verification")}
          />
          <MarketingNavItem
            icon={<Network />}
            label="Affiliates"
            active={activeTab === "affiliates"}
            onClick={() => setActiveTab("affiliates")}
          />
          <MarketingNavItem
            icon={<Crown />}
            label="Memberships"
            active={activeTab === "subscriptions"}
            onClick={() => setActiveTab("subscriptions")}
          />
          <MarketingNavItem
            icon={<Target />}
            label="Segments"
            active={activeTab === "segments"}
            onClick={() => setActiveTab("segments")}
          />
          <MarketingNavItem
            icon={<Mail />}
            label="Communications"
            active={activeTab === "communications"}
            onClick={() => setActiveTab("communications")}
          />
          <MarketingNavItem
            icon={<Smartphone />}
            label="Loyalty & VIP"
            active={activeTab === "loyalty"}
            onClick={() => setActiveTab("loyalty")}
          />
          <MarketingNavItem
            icon={<BarChart3 />}
            label="ROI Analytics"
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          />
        </nav>

        <div className="pt-8 border-t border-border space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-plum group"
            asChild
          >
            <Link href="/admin">
              <RefreshCcw className="w-4 h-4 mr-3" /> Master Control
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-ivory relative">
        <header className="flex justify-between items-center bg-white/80 luxury-blur p-8 border-b border-border sticky top-0 z-30">
          <div>
            <h1 className="text-3xl font-headline font-bold italic text-gray-900 uppercase tracking-widest">
              {activeTab}
            </h1>
            <p className="text-gray-400 text-[10px] tracking-widest uppercase font-bold mt-1">
              Marketing Oversight • CRM Terminal
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <Button
              className="bg-plum hover:bg-black text-white h-11 px-8 rounded-none text-[10px] font-bold uppercase tracking-widest shadow-lg transition-all"
              onClick={handleCreateFlashSale}
            >
              <Zap className="w-4 h-4 mr-2" /> NEW FLASH SALE
            </Button>
          </div>
        </header>

        {/* Campaign Editor Drawer */}
        <Sheet
          open={isCampaignEditorOpen}
          onOpenChange={setIsCampaignEditorOpen}
        >
          <SheetContent className="w-full sm:max-w-[540px] bg-white p-0 border-none rounded-none shadow-2xl">
            <form
              onSubmit={handleSaveCampaign}
              className="flex flex-col h-full"
            >
              <SheetHeader className="p-10 bg-slate-50 border-b border-slate-100">
                <SheetTitle className="font-headline text-3xl uppercase italic tracking-tighter">
                  Campaign Orchestrator
                </SheetTitle>
                <SheetDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                  Flash Sale & Event Design
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    Event Title
                  </Label>
                  <Input
                    value={editingCampaign?.title}
                    onChange={(e) =>
                      setEditingCampaign((prev) =>
                        prev ? { ...prev, title: e.target.value } : null
                      )
                    }
                    className="rounded-none border-slate-200 h-12 text-sm italic font-light"
                  />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      Event Type
                    </Label>
                    <Select
                      value={editingCampaign?.type}
                      onValueChange={(v) =>
                        setEditingCampaign((prev) =>
                          prev ? { ...prev, type: v as any } : null
                        )
                      }
                    >
                      <SelectTrigger className="rounded-none border-slate-200 h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-slate-100">
                        <SelectItem value="Flash Sale" className="text-xs">
                          Flash Sale
                        </SelectItem>
                        <SelectItem value="Launch" className="text-xs">
                          Collection Launch
                        </SelectItem>
                        <SelectItem value="VIP Exclusive" className="text-xs">
                          VIP Exclusive
                        </SelectItem>
                        <SelectItem value="Seasonal" className="text-xs">
                          Seasonal Event
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      Discount Logic (%)
                    </Label>
                    <Input
                      type="number"
                      value={editingCampaign?.discountValue}
                      onChange={(e) =>
                        setEditingCampaign((prev) =>
                          prev
                            ? {
                                ...prev,
                                discountValue: parseInt(e.target.value),
                              }
                            : null
                        )
                      }
                      className="rounded-none border-slate-200 h-12 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      Start Horizon
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input
                        type="date"
                        value={editingCampaign?.startDate}
                        onChange={(e) =>
                          setEditingCampaign((prev) =>
                            prev ? { ...prev, startDate: e.target.value } : null
                          )
                        }
                        className="rounded-none border-slate-200 h-12 pl-12 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      End Horizon
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <Input
                        type="date"
                        value={editingCampaign?.endDate}
                        onChange={(e) =>
                          setEditingCampaign((prev) =>
                            prev ? { ...prev, endDate: e.target.value } : null
                          )
                        }
                        className="rounded-none border-slate-200 h-12 pl-12 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                    Jurisdiction
                  </Label>
                  <Select
                    value={editingCampaign?.market}
                    onValueChange={(v) =>
                      setEditingCampaign((prev) =>
                        prev ? { ...prev, market: v as any } : null
                      )
                    }
                  >
                    <SelectTrigger className="rounded-none border-slate-200 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-100">
                      <SelectItem value="global" className="text-xs">
                        Global Master
                      </SelectItem>
                      <SelectItem value="us" className="text-xs">
                        USA Hub
                      </SelectItem>
                      <SelectItem value="ae" className="text-xs">
                        UAE Hub
                      </SelectItem>
                      <SelectItem value="uk" className="text-xs">
                        UK Hub
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none border-slate-200 text-[10px] font-bold uppercase h-12 px-8"
                  onClick={() => setIsCampaignEditorOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="rounded-none bg-plum text-white hover:bg-black text-[10px] font-bold uppercase h-12 px-10 shadow-lg"
                >
                  <Save className="w-4 h-4 mr-2" /> Authorize Campaign
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          {(activeTab === "dashboard" || activeTab === "campaigns") && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                  icon={<TrendingUp />}
                  label="Marketing Revenue"
                  value="$1.2M"
                  trend="+18.4%"
                  positive={true}
                />
                <StatCard
                  icon={<Tag />}
                  label="Avg. Discount"
                  value="12%"
                  trend="Controlled"
                  positive={true}
                />
                <StatCard
                  icon={<Users />}
                  label="Campaign Reach"
                  value="425k"
                  trend="+5.2%"
                  positive={true}
                />
                <StatCard
                  icon={<Clock />}
                  label="Scheduled Events"
                  value="03"
                  trend="Optimal"
                  positive={true}
                />
              </div>

              <Card className="bg-white border-border shadow-luxury overflow-hidden">
                <CardHeader className="border-b border-border bg-ivory/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="font-headline text-2xl">
                        Active & Scheduled Events
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase tracking-widest">
                        Global flash sale registry
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      className="h-9 border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-none"
                      onClick={handleCreateFlashSale}
                    >
                      <Plus className="w-3 h-3 mr-2" /> CREATE EVENT
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-ivory/50">
                      <TableRow>
                        <TableHead className="text-[9px] uppercase font-bold pl-8">
                          Campaign Title
                        </TableHead>
                        <TableHead className="text-[9px] uppercase font-bold">
                          Type
                        </TableHead>
                        <TableHead className="text-[9px] uppercase font-bold">
                          Discount
                        </TableHead>
                        <TableHead className="text-[9px] uppercase font-bold">
                          Window
                        </TableHead>
                        <TableHead className="text-[9px] uppercase font-bold text-center">
                          Status
                        </TableHead>
                        <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeCampaigns.map((camp) => (
                        <TableRow
                          key={camp.id}
                          className="hover:bg-ivory/30 transition-colors"
                        >
                          <TableCell className="pl-8">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold leading-tight uppercase tracking-tight">
                                {camp.title}
                              </span>
                              <span className="text-[8px] text-gray-400 uppercase tracking-widest">
                                {camp.market} Market Hub
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[8px] uppercase tracking-widest"
                            >
                              {camp.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-bold text-plum">
                              {camp.discountValue}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2 text-[9px] font-bold uppercase text-slate-400">
                              <span>{camp.startDate}</span>
                              <ChevronRight className="w-2.5 h-2.5" />
                              <span>{camp.endDate}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={cn(
                                "text-[8px] uppercase tracking-widest",
                                camp.status === "active"
                                  ? "bg-green-50 text-green-600"
                                  : camp.status === "scheduled"
                                  ? "bg-gold/10 text-gold"
                                  : "bg-slate-100 text-slate-400"
                              )}
                            >
                              {camp.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-plum"
                              onClick={() => {
                                setEditingCampaign({ ...camp });
                                setIsCampaignEditorOpen(true);
                              }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "verification" && (
            <div className="space-y-12">
              <div className="space-y-2">
                <h2 className="text-2xl font-headline font-bold italic">
                  Elite Client Registry
                </h2>
                <p className="text-[10px] uppercase tracking-widest text-gray-400">
                  Verify connoisseur credentials for archival acquisition access
                </p>
              </div>

              <Card className="bg-white border-border shadow-luxury overflow-hidden">
                <Table>
                  <TableHeader className="bg-ivory/50">
                    <TableRow>
                      <TableHead className="text-[9px] uppercase font-bold pl-8">
                        Connoisseur
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold">
                        Email
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold">
                        Tier
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-center">
                        Status
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vipClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="hover:bg-ivory/30 transition-colors"
                      >
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold leading-tight uppercase tracking-tight">
                              {client.name}
                            </span>
                            <span className="text-[8px] text-gray-400 uppercase tracking-widest">
                              Lifetime Value: $
                              {client.totalSpend.toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-light">
                          {client.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[8px] uppercase tracking-widest"
                          >
                            {client.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={cn(
                              "text-[8px] uppercase tracking-widest",
                              client.status === "verified"
                                ? "bg-green-50 text-green-600"
                                : client.status === "rejected"
                                ? "bg-red-50 text-red-600"
                                : "bg-gold/10 text-gold"
                            )}
                          >
                            {client.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          {client.status === "pending" || !client.status ? (
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                className="h-8 bg-black text-white hover:bg-plum text-[8px] font-bold uppercase"
                                onClick={() => verifyClient(client.id)}
                              >
                                VERIFY
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
                              >
                                <ShieldCheck className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end items-center text-green-500 space-x-2">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[8px] font-bold uppercase">
                                Identity Secured
                              </span>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {[
            "segments",
            "affiliates",
            "subscriptions",
            "communications",
            "loyalty",
            "analytics",
          ].includes(activeTab) && (
            <div className="py-40 text-center space-y-6">
              <div className="flex justify-center">
                <div className="p-12 bg-ivory border border-border rounded-full animate-pulse">
                  <Megaphone className="w-12 h-12 text-gold/30 mx-auto" />
                </div>
              </div>
              <p className="text-2xl text-muted-foreground font-light italic font-headline">
                The {activeTab} workspace is currently synchronizing with the
                global Maison engagement engine.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MarketingNavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
