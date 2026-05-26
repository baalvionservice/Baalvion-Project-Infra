"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Boxes,
  ChevronRight,
  ArrowRight,
  Tag,
  ShieldCheck,
  Database,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Lock,
  Eye,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/use-search";
import { useToast } from "@/hooks/use-toast";

/**
 * Commerce Command Hub: Tactical Layer 4 Node.
 * Consolidates Product Registry, Order Fulfillment, and Atomic Inventory.
 */
export default function CommerceCommandHub() {
  const {
    scopedProducts,
    scopedTransactions,
    deleteProduct,
    updateTransactionStatus,
    updateInventory,
    adminJurisdiction,
  } = useAppStore();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const filteredProducts = useSearch(scopedProducts, searchQuery);
  const filteredOrders = scopedTransactions.filter(
    (t) =>
      (t.clientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(
    () => ({
      totalRegistry: scopedProducts.length,
      activeOrders: scopedTransactions.filter(
        (t) => t.status !== "Closed" && t.status !== "Refunded"
      ).length,
      lowStock: scopedProducts.filter((p) => p.stock < 3).length,
      revenueToday: scopedTransactions
        .filter(
          (t) =>
            t.status === "Settled" &&
            new Date(t.timestamp).toDateString() === new Date().toDateString()
        )
        .reduce((acc, t) => acc + t.amount, 0),
    }),
    [scopedProducts, scopedTransactions]
  );

  const handleStatusUpdate = (id: string, status: any) => {
    updateTransactionStatus(id, status);
    toast({
      title: "Acquisition State Updated",
      description: `Order ${id} is now ${status}.`,
    });
  };

  const handleStockAdj = (id: string, adj: number) => {
    updateInventory(
      id,
      (adminJurisdiction === "global" ? "us" : adminJurisdiction) as any,
      adj
    );
    toast({
      title: "Inventory Refined",
      description: `Stock adjusted by ${adj} units.`,
    });
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
            <Package className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">
              Tactical Layer 4
            </span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            Commerce Hub
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Orchestrating the global artifact registry and settlement pipeline.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="h-14 px-10 rounded-none bg-blue-600 text-white hover:bg-blue-500 transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/20">
            <Plus className="w-4 h-4 mr-3" /> REGISTER NEW ARTIFACT
          </Button>
        </div>
      </header>

      <Tabs
        defaultValue="overview"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="bg-[#111113] border border-white/5 h-14 w-full justify-start p-1 rounded-none space-x-2 mb-10">
          <TabsTrigger
            value="overview"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="catalog"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Artifact Registry
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Acquisition Stream
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="tab-trigger-modern !text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none"
          >
            Inventory Matrix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-10 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <DashboardStat
              label="Registry Total"
              value={stats.totalRegistry}
              trend="Verified"
              icon={<Package />}
            />
            <DashboardStat
              label="Acquisitions Active"
              value={stats.activeOrders}
              trend="In Pipeline"
              icon={<ShoppingCart />}
            />
            <DashboardStat
              label="Yield (24h)"
              value={`$${(stats.revenueToday / 1000).toFixed(1)}k`}
              trend="Live"
              icon={<TrendingUp />}
              color="text-blue-400"
            />
            <DashboardStat
              label="Scarcity Alerts"
              value={stats.lowStock}
              trend="Restock Needed"
              icon={<AlertTriangle />}
              color="text-gold"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <Card className="lg:col-span-8 bg-[#111113] border-white/5 rounded-none overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] p-8 flex flex-row justify-between items-center">
                <div>
                  <CardTitle className="font-headline text-2xl text-white italic">
                    Recent Acquisitions
                  </CardTitle>
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">
                    Latest settlement events across jurisdictional hubs
                  </CardDescription>
                </div>
                <Link href="/admin/finance">
                  <Button
                    variant="ghost"
                    className="text-[9px] font-bold uppercase tracking-widest text-blue-400"
                  >
                    View Treasury <ArrowRight className="ml-2 w-3 h-3" />
                  </Button>
                </Link>
              </CardHeader>
              <div className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                        Reference
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        Connoisseur
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        Artifact
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                        Delta
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopedTransactions.slice(0, 5).map((tx) => (
                      <TableRow
                        key={tx.id}
                        className="hover:bg-white/5 transition-colors border-white/5 h-16"
                      >
                        <TableCell className="pl-8 font-mono text-[10px] text-blue-400 uppercase">
                          {tx.id}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-white/80 uppercase">
                          {tx.clientName}
                        </TableCell>
                        <TableCell className="text-xs font-light italic text-white/40 truncate max-w-[200px]">
                          {tx.artifactName}
                        </TableCell>
                        <TableCell className="text-right pr-8 text-sm font-bold text-white tabular">
                          ${tx.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <aside className="lg:col-span-4 space-y-8">
              <Card className="bg-black text-white p-10 space-y-8 shadow-2xl relative overflow-hidden rounded-none border-none h-full flex flex-col justify-center">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-40 h-40 text-blue-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-headline font-bold italic tracking-tight">
                    Registry Health
                  </h3>
                  <p className="text-sm font-light italic text-white/60 leading-relaxed">
                    "The Maison artifact registry is operating with 100% data
                    integrity. All atomic inventory locks are synchronized with
                    global settlement gateways."
                  </p>
                </div>
                <div className="space-y-6 pt-6 border-t border-white/10">
                  <HealthLine label="Catalog Sync" val={100} />
                  <HealthLine label="Fulfillment Velocity" val={92} />
                  <HealthLine label="Inventory Accuracy" val={100} />
                </div>
              </Card>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="relative group w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400" />
              <input
                type="text"
                placeholder="Filter global registry..."
                className="w-full bg-[#111113] border border-white/10 h-14 pl-12 pr-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-blue-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="h-14 px-8 rounded-none border-white/10 text-white/40 hover:bg-white hover:text-black text-[9px] font-bold uppercase tracking-widest transition-all"
              >
                <Filter className="w-3.5 h-3.5 mr-2" /> ADVANCED FILTERS
              </Button>
            </div>
          </div>

          <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                    Artifact
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Status
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Strategy
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.slice(0, 10).map((prod) => (
                  <TableRow
                    key={prod.id}
                    className="hover:bg-white/5 transition-colors border-white/5 h-20"
                  >
                    <TableCell className="pl-8">
                      <div className="flex items-center space-x-6">
                        <div className="w-12 h-14 bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white/20">
                          ASSET
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white uppercase tracking-tight">
                            {prod.name}
                          </span>
                          <span className="text-[9px] text-white/20 font-mono">
                            REF: {prod.id.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[7px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 uppercase"
                      >
                        {prod.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[7px] border-none uppercase",
                          prod.isVip
                            ? "bg-plum text-white"
                            : "bg-white/10 text-white/40"
                        )}
                      >
                        {prod.isVip ? (
                          <Lock className="w-2.5 h-2.5 mr-1.5" />
                        ) : (
                          <Eye className="w-2.5 h-2.5 mr-1.5" />
                        )}
                        {prod.isVip ? "PRIVATE SALON" : "REGISTRY STD"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/20 hover:text-white"
                          asChild
                        >
                          <Link href={`/admin/content?edit=${prod.id}`}>
                            <Edit3 size={16} />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/20 hover:text-red-500"
                          onClick={() => deleteProduct(prod.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-8 animate-fade-in">
          <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                    Reference
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Connoisseur
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-white/40">
                    Lifecycle Status
                  </TableHead>
                  <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                    Update Pipeline
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-white/5 transition-colors border-white/5 h-20"
                  >
                    <TableCell className="pl-8 font-mono text-blue-400 text-xs uppercase">
                      {order.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white/80 uppercase">
                          {order.clientName}
                        </span>
                        <span className="text-[8px] text-white/20 uppercase tracking-widest">
                          {(order.country || "").toUpperCase()} HUB
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[8px] uppercase border-none px-3 py-1",
                          order.status === "Settled"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-white/10 text-white/40"
                        )}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end space-x-3">
                        {(
                          [
                            "Confirmed",
                            "Processing",
                            "Shipped",
                            "Delivered",
                          ] as const
                        ).map((s) => (
                          <button
                            key={s}
                            onClick={() =>
                              handleStatusUpdate(order.id, s as any)
                            }
                            className={cn(
                              "px-3 py-1.5 text-[7px] font-bold uppercase tracking-widest transition-all",
                              order.status === s
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-white/5 text-white/20 hover:bg-white/10"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-10 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">
                        Artifact SKU
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        Total Stock
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        Reserved (Locks)
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-white/40">
                        Available
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">
                        Adjust
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scopedProducts.slice(0, 10).map((prod) => (
                      <TableRow
                        key={prod.id}
                        className="hover:bg-white/5 transition-colors border-white/5 h-16"
                      >
                        <TableCell className="pl-8 font-mono text-[10px] text-white/60 uppercase">
                          {prod.id}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-white/80 tabular">
                          {prod.stock + 2}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-gold">
                            <Lock className="w-3 h-3" />
                            <span className="text-xs font-bold tabular">2</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-emerald-400 tabular">
                          {prod.stock}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleStockAdj(prod.id, -1)}
                              className="w-8 h-8 bg-white/5 flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleStockAdj(prod.id, 1)}
                              className="w-8 h-8 bg-white/5 flex items-center justify-center text-white/40 hover:bg-white hover:text-black transition-all"
                            >
                              +
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <aside className="lg:col-span-4 space-y-8">
              <Card className="bg-[#111113] border-white/5 p-10 space-y-8 rounded-none">
                <div className="flex items-center space-x-3 text-blue-400">
                  <Clock className="w-5 h-5" />
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">
                    Atomic Lock TTL
                  </h4>
                </div>
                <p className="text-[11px] text-white/40 font-light italic leading-relaxed">
                  "Inventory is locked for 15 minutes upon checkout initiation.
                  Expired locks are automatically restored to the registry by
                  the background janitor."
                </p>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                    <span className="opacity-20">Active Locks</span>
                    <span className="text-gold">14 Artifacts</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                    <span className="opacity-20">Expiring (1m)</span>
                    <span className="text-gold">3 Artifacts</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-12 border-white/10 text-white/60 hover:bg-white hover:text-black text-[9px] font-bold uppercase tracking-widest rounded-none"
                >
                  FORCE LOCK FLUSH
                </Button>
              </Card>
            </aside>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardStat({
  label,
  value,
  trend,
  icon,
  color = "text-white",
}: any) {
  return (
    <Card className="bg-[#111113] border-white/5 p-8 space-y-4 group hover:border-blue-500/40 transition-all rounded-none shadow-xl">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20 group-hover:text-blue-400 transition-colors">
          {label}
        </span>
        <div className="text-white/20">
          {React.cloneElement(icon as React.ReactElement<any>, { size: 16 })}
        </div>
      </div>
      <div
        className={cn("text-4xl font-headline font-bold italic tabular", color)}
      >
        {value}
      </div>
      <Badge
        variant="outline"
        className="text-[7px] uppercase border-white/10 text-white/40"
      >
        {trend}
      </Badge>
    </Card>
  );
}

function HealthLine({ label, val }: { label: string; val: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-[0.3em]">
        <span className="opacity-40">{label}</span>
        <span className="text-blue-400">{val}%</span>
      </div>
      <div className="h-0.5 bg-white/5 w-full">
        <div
          className="h-full bg-blue-500 transition-all duration-1000"
          style={{ width: `${val}%` }}
        />
      </div>
    </div>
  );
}
