"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Truck,
  BarChart3,
  CreditCard,
  UserCircle,
  LogOut,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Eye,
  TrendingUp,
  Clock,
  RefreshCcw,
  RotateCcw,
  Zap,
  Globe,
  Briefcase,
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
import { Progress } from "@/components/ui/progress";
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
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { guardAction } from "@/lib/access/apiGuard";

type VendorTab =
  | "dashboard"
  | "catalog"
  | "orders"
  | "reports"
  | "finances"
  | "profile";

export default function VendorAdminPanel() {
  const [activeTab, setActiveTab] = useState<VendorTab>("dashboard");
  const {
    activeVendor,
    setActiveVendor,
    vendors,
    products,
    deleteProduct,
    currentUser,
    submitApproval,
  } = useAppStore();
  const { toast } = useToast();

  useEffect(() => {
    // Scoped Brand Isolation: Vendors cannot switch context manually if already set by session
    if (currentUser?.role === "vendor" && activeVendor?.id !== currentUser.id) {
      // In a real system, the store would enforce this automatically
      console.warn("Brand Identity Isolation Enforced");
    }
  }, [currentUser, activeVendor]);

  const vendorProducts = useMemo(
    () => products.filter((p) => p.vendorId === activeVendor?.id),
    [products, activeVendor]
  );

  const handleAction = (msg: string) => {
    toast({ title: "Atelier Action", description: msg });
  };

  const handleSubmission = (productId: string) => {
    submitApproval(productId);
    toast({
      title: "Submitted for Audit",
      description: "Maison curators will review your registry entry.",
    });
  };

  const handleDelete = (id: string) => {
    // Functional API Guard Enforcement
    const res = guardAction(currentUser, "delete_listing", activeVendor?.id);
    if (res.success) {
      deleteProduct(id);
      toast({
        title: "Artifact De-Registered",
        description: "Entry removed from Maison archive.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Security Alert",
        description: res.error,
      });
    }
  };

  if (!activeVendor) {
    return (
      <div className="h-screen flex items-center justify-center bg-ivory uppercase tracking-[0.5em] font-headline text-muted-foreground animate-pulse">
        Establishing Brand Identity...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-ivory overflow-hidden font-body text-gray-900">
      <aside className="w-72 border-r border-border bg-white p-8 flex flex-col space-y-12 shadow-sm z-20">
        <div className="space-y-4">
          <div className="font-headline text-3xl font-bold tracking-tighter text-gray-900">
            AMARISÉ{" "}
            <span className="text-gold text-xs font-normal tracking-[0.4em] ml-2">
              BRAND
            </span>
          </div>
          <div className="p-4 bg-plum/5 border border-plum/10 rounded-sm">
            <p className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">
              Partner Atelier
            </p>
            <p className="text-xs font-bold text-plum truncate">
              {activeVendor.name}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
          <VendorNavItem
            icon={<LayoutDashboard />}
            label="Resonance"
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          />
          <VendorNavItem
            icon={<Package />}
            label="Atelier Catalog"
            active={activeTab === "catalog"}
            onClick={() => setActiveTab("catalog")}
          />
          <VendorNavItem
            icon={<Truck />}
            label="Fulfillment"
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />
          <VendorNavItem
            icon={<BarChart3 />}
            label="Analytics"
            active={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
          />
          <VendorNavItem
            icon={<CreditCard />}
            label="Finances"
            active={activeTab === "finances"}
            onClick={() => setActiveTab("finances")}
          />
          <VendorNavItem
            icon={<UserCircle />}
            label="Brand Identity"
            active={activeTab === "profile"}
            onClick={() => setActiveTab("profile")}
          />
        </nav>

        <div className="pt-8 border-t border-border space-y-4">
          {currentUser?.role === "super_admin" && (
            <div className="space-y-2">
              <p className="text-[8px] text-gray-400 uppercase tracking-widest px-4 font-bold">
                Switch Identity (Global)
              </p>
              <Select
                value={activeVendor.id}
                onValueChange={(id) =>
                  setActiveVendor(vendors.find((v) => v.id === id) || null)
                }
              >
                <SelectTrigger className="bg-ivory border-border text-[10px] font-bold uppercase h-10 rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-border shadow-luxury">
                  {vendors.map((v) => (
                    <SelectItem
                      key={v.id}
                      value={v.id}
                      className="text-[10px] uppercase font-bold"
                    >
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-plum group"
            asChild
          >
            <Link href="/us">
              <LogOut className="w-4 h-4 mr-3" /> Exit Portal
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
              {activeVendor.name} • Global Partner Hub
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Brand performance
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Progress
                  value={activeVendor.performance}
                  className="h-1 w-20 bg-ivory"
                />
                <span className="text-[10px] font-bold text-gold">
                  {activeVendor.performance}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 bg-ivory border border-border rounded-sm flex items-center justify-center font-headline text-xl font-bold italic text-plum border-plum/20">
              {activeVendor.name.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-12 space-y-12 animate-fade-in pb-32">
          {activeTab === "dashboard" && (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                  icon={<TrendingUp />}
                  label="Artisanal Revenue"
                  value={`$${(activeVendor.salesTotal / 1000).toFixed(1)}k`}
                  trend="+8.4%"
                  positive={true}
                />
                <StatCard
                  icon={<Clock />}
                  label="Pending Orders"
                  value="04"
                  trend="Immediate"
                  positive={false}
                />
                <StatCard
                  icon={<Package />}
                  label="Collection Health"
                  value={`${vendorProducts.length} Pieces`}
                  trend="Optimal"
                  positive={true}
                />
                <StatCard
                  icon={<Zap />}
                  label="Engagement"
                  value="4.2%"
                  trend="High"
                  positive={true}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <Card className="lg:col-span-2 bg-white border-border shadow-luxury">
                  <CardHeader className="border-b border-border">
                    <CardTitle className="font-headline text-2xl">
                      Fulfillment Stream
                    </CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-widest">
                      Active acquisitions for your brand
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-ivory/50">
                        <TableRow>
                          <TableHead className="text-[9px] uppercase font-bold pl-8">
                            Order ID
                          </TableHead>
                          <TableHead className="text-[9px] uppercase font-bold">
                            Piece
                          </TableHead>
                          <TableHead className="text-[9px] uppercase font-bold">
                            Region
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
                        {[1, 2, 3].map((i) => (
                          <TableRow key={i} className="hover:bg-ivory/30">
                            <TableCell className="text-xs font-bold font-mono pl-8">
                              #AM-{2000 + i}
                            </TableCell>
                            <TableCell className="text-xs font-light italic truncate max-w-[150px]">
                              {vendorProducts[i % vendorProducts.length]
                                ?.name || "Artisanal Artifact"}
                            </TableCell>
                            <TableCell className="text-[10px] uppercase tracking-widest font-bold">
                              US
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className="bg-gold/10 text-gold text-[8px] uppercase tracking-widest">
                                Preparing
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gold"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="bg-white border-border shadow-luxury overflow-hidden">
                  <div className="aspect-[4/5] relative bg-muted flex items-center justify-center border-b border-border">
                    <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300">
                      Maison Concierge View
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-plum/80 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-0 inset-x-0 p-8 text-white space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold">
                        Brand support
                      </span>
                      <h4 className="text-2xl font-headline font-bold italic">
                        Atelier Manager
                      </h4>
                      <p className="text-[10px] font-light italic opacity-80">
                        Our global partner curators are available for logistical
                        coordination.
                      </p>
                      <Button className="w-full h-10 bg-white text-plum mt-4 rounded-none text-[10px] font-bold tracking-widest uppercase shadow-lg">
                        Contact Manager
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "catalog" && (
            <div className="space-y-12">
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <h2 className="text-2xl font-headline font-bold italic">
                    Atelier Registry
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400">
                    Manage your exclusive artisanal collection
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    className="border-border text-gray-400 h-12 px-8 rounded-none text-[10px] font-bold tracking-widest uppercase"
                    onClick={() =>
                      handleAction("Bulk collection export initiated.")
                    }
                  >
                    Export catalog
                  </Button>
                  <Button className="bg-plum text-white hover:bg-gold h-12 px-8 rounded-none text-[10px] font-bold tracking-widest uppercase">
                    <Plus className="w-4 h-4 mr-2" /> CREATE NEW ENTRY
                  </Button>
                </div>
              </div>

              <Card className="bg-white border-border shadow-luxury overflow-hidden">
                <Table>
                  <TableHeader className="bg-ivory/50">
                    <TableRow>
                      <TableHead className="text-[9px] uppercase font-bold pl-8">
                        Artifact
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold">
                        Category
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-center">
                        In Registry
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right">
                        Value
                      </TableHead>
                      <TableHead className="text-[9px] uppercase font-bold text-right pr-8">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorProducts.map((product) => (
                      <TableRow
                        key={product.id}
                        className="hover:bg-ivory/30 transition-colors"
                      >
                        <TableCell className="pl-8">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-12 bg-muted rounded-sm overflow-hidden flex-shrink-0 flex items-center justify-center text-[6px] font-bold uppercase text-gray-400 border border-border">
                              Asset
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold leading-tight">
                                {product.name}
                              </span>
                              <span className="text-[8px] text-gray-400 uppercase tracking-tighter">
                                SKU: {product.id.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[8px] uppercase tracking-widest"
                          >
                            {product.categoryId}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              product.stock < 5
                                ? "text-red-500"
                                : "text-gray-500"
                            )}
                          >
                            {product.stock} Units
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs font-light">
                          ${product.basePrice.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-plum"
                              title="Submit for Audit"
                              onClick={() => handleSubmission(product.id)}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gold"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function VendorNavItem({
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
