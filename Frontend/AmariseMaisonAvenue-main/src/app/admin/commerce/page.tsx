"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Search,
  Plus,
  Edit3,
  Trash2,
  Lock,
  Eye,
  Loader2,
  AlertCircle,
  Save,
  ShieldCheck,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  productApi,
  orderApi,
  type ProductDetail,
  type ProductListItem,
  type Order,
  type OrderStatus,
} from "@/lib/api-client";

/**
 * Commerce Command Hub — LIVE product catalog + order fulfillment.
 * Products via productApi (commerce-service), orders via orderApi (order-service).
 * Includes a product editor that sets resale provenance (condition grade, authenticity
 * status, one-of-a-kind, serial number).
 */

const ORDER_STATUSES: OrderStatus[] = [
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];

const CONDITION_GRADES = [
  "pristine",
  "excellent",
  "very_good",
  "good",
  "fair",
] as const;

type EditableProduct = Partial<ProductDetail> & { id?: string };

function emptyProduct(): EditableProduct {
  return {
    name: "",
    basePrice: 0,
    stock: 1,
    status: "draft",
    isVip: false,
    isOneOfAKind: false,
  };
}

export default function CommerceCommandHub() {
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductError(null);
    const res = await productApi.list({ pageSize: 100 });
    if (res.ok) setProducts(res.data.items ?? []);
    else setProductError(res.error.message || "Could not load the product registry.");
    setLoadingProducts(false);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrderError(null);
    const res = await orderApi.list({ pageSize: 50 });
    if (res.ok) setOrders(res.data.items ?? []);
    else setOrderError(res.error.message || "Could not load orders.");
    setLoadingOrders(false);
  }, []);

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, [loadProducts, loadOrders]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter(
      (o) => o.status !== "delivered" && o.status !== "cancelled" && o.status !== "refunded",
    ).length;
    const lowStock = products.filter((p) => (p.stock ?? 0) < 3).length;
    const revenue = orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((acc, o) => acc + (o.totalAmount ?? 0), 0);
    return { totalRegistry: products.length, activeOrders, lowStock, revenue };
  }, [products, orders]);

  const openCreate = () => {
    setEditing(emptyProduct());
    setIsEditorOpen(true);
  };

  const openEdit = async (id: string) => {
    const res = await productApi.get(id);
    if (res.ok) {
      setEditing({ ...res.data });
      setIsEditorOpen(true);
    } else {
      toast({
        variant: "destructive",
        title: "Could not open artifact",
        description: res.error.message,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name?.trim()) {
      toast({ variant: "destructive", title: "Name required", description: "Artifact needs a name." });
      return;
    }
    setSaving(true);
    const payload: Partial<ProductDetail> = {
      name: editing.name,
      basePrice: Number(editing.basePrice) || 0,
      stock: Number(editing.stock) || 0,
      status: editing.status,
      isVip: !!editing.isVip,
      description: editing.description,
      conditionGrade: editing.conditionGrade,
      authenticityStatus: editing.authenticityStatus,
      authenticityCertificateCode: editing.authenticityCertificateCode,
      isOneOfAKind: !!editing.isOneOfAKind,
      serialNumber: editing.serialNumber,
    };
    const res = editing.id
      ? await productApi.update(editing.id, payload)
      : await productApi.create(payload);
    setSaving(false);
    if (res.ok) {
      toast({ title: "Registry updated", description: `${res.data.name} synchronized.` });
      setIsEditorOpen(false);
      setEditing(null);
      loadProducts();
    } else {
      toast({ variant: "destructive", title: "Save failed", description: res.error.message });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await productApi.delete(id);
    if (res.ok) {
      toast({ title: "Artifact de-registered", description: "Entry removed from the catalog." });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      toast({ variant: "destructive", title: "Delete failed", description: res.error.message });
    }
  };

  const handleOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingOrderId(orderId);
    const res = await orderApi.updateStatus(orderId, status);
    setUpdatingOrderId(null);
    if (res.ok) {
      toast({ title: "Order updated", description: `Order is now ${status}.` });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
    } else {
      toast({ variant: "destructive", title: "Update failed", description: res.error.message });
    }
  };

  return (
    <div className="space-y-12 animate-fade-in font-body pb-20">
      <header className="flex justify-between items-end border-b border-white/5 pb-12">
        <div className="space-y-2">
          <div className="flex items-center space-x-3 mb-2 text-blue-400">
            <Package className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Tactical Layer 4</span>
          </div>
          <h1 className="text-5xl font-headline font-bold italic tracking-tight text-white uppercase leading-none">
            Commerce Hub
          </h1>
          <p className="text-sm text-white/40 font-light italic">
            Live catalog registry and order settlement pipeline.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-14 px-10 rounded-none bg-blue-600 text-white hover:bg-blue-500 transition-all text-[10px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-blue-600/20"
        >
          <Plus className="w-4 h-4 mr-3" /> Register New Artifact
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <DashboardStat label="Registry Total" value={stats.totalRegistry} icon={<Package />} />
        <DashboardStat label="Active Orders" value={stats.activeOrders} icon={<ShoppingCart />} />
        <DashboardStat
          label="Paid Revenue"
          value={`$${(stats.revenue / 1000).toFixed(1)}k`}
          icon={<TrendingUp />}
          color="text-blue-400"
        />
        <DashboardStat label="Low Stock" value={stats.lowStock} icon={<AlertTriangle />} color="text-gold" />
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="bg-[#111113] border border-white/5 h-14 w-full justify-start p-1 rounded-none space-x-2 mb-10">
          <TabsTrigger value="catalog" className="!text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none">
            Artifact Registry
          </TabsTrigger>
          <TabsTrigger value="orders" className="!text-white/40 data-[state=active]:!bg-white/5 data-[state=active]:!text-white rounded-none">
            Order Stream
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-8 animate-fade-in">
          <div className="relative group w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400" />
            <input
              type="text"
              placeholder="Filter registry..."
              className="w-full bg-[#111113] border border-white/10 h-14 pl-12 pr-4 text-xs font-bold uppercase tracking-widest text-white outline-none focus:border-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
            {loadingProducts ? (
              <LoadingState label="Loading registry…" />
            ) : productError ? (
              <ErrorState message={productError} onRetry={loadProducts} />
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Artifact</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Price / Stock</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Status</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((prod) => (
                    <TableRow key={prod.id} className="hover:bg-white/5 transition-colors border-white/5 h-20">
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white uppercase tracking-tight">{prod.name}</span>
                          <span className="text-[9px] text-white/20 font-mono">REF: {prod.id.toUpperCase()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white tabular">${(prod.basePrice ?? 0).toLocaleString()}</span>
                          <span className={cn("text-[9px] font-bold uppercase", (prod.stock ?? 0) < 3 ? "text-red-400" : "text-white/40")}>
                            {prod.stock ?? 0} in stock
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[7px] uppercase border-none",
                            prod.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-white/10 text-white/40",
                          )}
                        >
                          {prod.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/20 hover:text-white"
                            onClick={() => openEdit(prod.id)}
                          >
                            <Edit3 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/20 hover:text-red-500"
                            onClick={() => handleDelete(prod.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-24 text-center text-white/30 text-[11px] font-bold uppercase tracking-widest italic">
                        No artifacts in the registry.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-8 animate-fade-in">
          <Card className="bg-[#111113] border-white/5 rounded-none overflow-hidden shadow-2xl">
            {loadingOrders ? (
              <LoadingState label="Loading orders…" />
            ) : orderError ? (
              <ErrorState message={orderError} onRetry={loadOrders} />
            ) : (
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="text-[9px] uppercase font-bold pl-8 text-white/40">Order</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Total</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Payment</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-white/40">Status</TableHead>
                    <TableHead className="text-[9px] uppercase font-bold text-right pr-8 text-white/40">Advance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-white/5 transition-colors border-white/5 h-20">
                      <TableCell className="pl-8 font-mono text-blue-400 text-[10px] uppercase">
                        {order.orderNumber || order.id}
                      </TableCell>
                      <TableCell className="text-sm font-bold text-white tabular">
                        {order.currencyCode} {(order.totalAmount ?? 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[7px] uppercase border-none bg-white/10 text-white/50">
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] uppercase border-none px-3 py-1",
                            order.status === "delivered"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : order.status === "cancelled" || order.status === "refunded"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-white/10 text-white/40",
                          )}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end items-center space-x-2">
                          {updatingOrderId === order.id && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                          <Select
                            value={order.status}
                            onValueChange={(v) => handleOrderStatus(order.id, v as OrderStatus)}
                          >
                            <SelectTrigger className="h-9 w-36 rounded-none bg-white/5 border-white/10 text-[9px] font-bold uppercase tracking-widest text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111113] border-white/10 rounded-none">
                              {ORDER_STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="text-[9px] uppercase font-bold">
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {orders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-24 text-center text-white/30 text-[11px] font-bold uppercase tracking-widest italic">
                        No orders yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product editor (create / edit) with provenance fields */}
      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent className="w-full sm:max-w-[640px] bg-[#0A0A0B] border-l border-white/10 p-0 rounded-none">
          <form onSubmit={handleSave} className="flex flex-col h-full text-white">
            <SheetHeader className="p-10 bg-white/[0.02] border-b border-white/5 text-left">
              <SheetTitle className="font-headline text-3xl uppercase italic tracking-tighter text-white">
                {editing?.id ? "Edit Artifact" : "Register Artifact"}
              </SheetTitle>
              <SheetDescription className="text-[10px] uppercase font-bold tracking-widest text-white/30">
                Master metadata + provenance
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              <Field label="Artifact Name">
                <Input
                  value={editing?.name ?? ""}
                  onChange={(e) => setEditing((p) => (p ? { ...p, name: e.target.value } : p))}
                  className="rounded-none bg-white/5 border-white/10 h-12 text-sm text-white"
                />
              </Field>

              <div className="grid grid-cols-2 gap-8">
                <Field label="Base Price ($)">
                  <Input
                    type="number"
                    value={editing?.basePrice ?? 0}
                    onChange={(e) => setEditing((p) => (p ? { ...p, basePrice: parseFloat(e.target.value) } : p))}
                    className="rounded-none bg-white/5 border-white/10 h-12 text-sm font-bold text-white"
                  />
                </Field>
                <Field label="Stock">
                  <Input
                    type="number"
                    value={editing?.stock ?? 0}
                    onChange={(e) => setEditing((p) => (p ? { ...p, stock: parseInt(e.target.value, 10) } : p))}
                    className="rounded-none bg-white/5 border-white/10 h-12 text-sm font-bold text-white"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <Field label="Status">
                  <Select
                    value={editing?.status ?? "draft"}
                    onValueChange={(v) => setEditing((p) => (p ? { ...p, status: v as ProductDetail["status"] } : p))}
                  >
                    <SelectTrigger className="h-12 rounded-none bg-white/5 border-white/10 text-sm text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111113] border-white/10 rounded-none">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Acquisition Flow">
                  <button
                    type="button"
                    onClick={() => setEditing((p) => (p ? { ...p, isVip: !p.isVip } : p))}
                    className="flex items-center justify-between w-full h-12 px-4 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <span className="flex items-center gap-2 text-white/70">
                      {editing?.isVip ? <Lock className="w-3.5 h-3.5 text-plum" /> : <Eye className="w-3.5 h-3.5 text-white/40" />}
                      {editing?.isVip ? "Private Salon" : "Standard"}
                    </span>
                  </button>
                </Field>
              </div>

              <Field label="Description">
                <Textarea
                  value={editing?.description ?? ""}
                  onChange={(e) => setEditing((p) => (p ? { ...p, description: e.target.value } : p))}
                  className="rounded-none bg-white/5 border-white/10 min-h-[100px] text-xs text-white"
                  placeholder="Provenance and rarity…"
                />
              </Field>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-3 text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.4em]">Resale Provenance</span>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <Field label="Condition Grade">
                    <Select
                      value={editing?.conditionGrade ?? ""}
                      onValueChange={(v) =>
                        setEditing((p) => (p ? { ...p, conditionGrade: v as ProductDetail["conditionGrade"] } : p))
                      }
                    >
                      <SelectTrigger className="h-12 rounded-none bg-white/5 border-white/10 text-sm text-white">
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#111113] border-white/10 rounded-none">
                        {CONDITION_GRADES.map((g) => (
                          <SelectItem key={g} value={g} className="text-xs uppercase">
                            {g.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Authenticity Status">
                    <Input
                      value={editing?.authenticityStatus ?? ""}
                      onChange={(e) => setEditing((p) => (p ? { ...p, authenticityStatus: e.target.value } : p))}
                      className="rounded-none bg-white/5 border-white/10 h-12 text-sm text-white"
                      placeholder="e.g. verified"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <Field label="Serial Number">
                    <Input
                      value={editing?.serialNumber ?? ""}
                      onChange={(e) => setEditing((p) => (p ? { ...p, serialNumber: e.target.value } : p))}
                      className="rounded-none bg-white/5 border-white/10 h-12 text-sm font-mono text-white"
                    />
                  </Field>
                  <Field label="Certificate Code">
                    <Input
                      value={editing?.authenticityCertificateCode ?? ""}
                      onChange={(e) =>
                        setEditing((p) => (p ? { ...p, authenticityCertificateCode: e.target.value } : p))
                      }
                      className="rounded-none bg-white/5 border-white/10 h-12 text-sm font-mono text-white"
                    />
                  </Field>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing((p) => (p ? { ...p, isOneOfAKind: !p.isOneOfAKind } : p))}
                  className="flex items-center justify-between w-full h-12 px-4 bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/70"
                >
                  <span>One-of-a-kind piece</span>
                  <div className={cn("w-10 h-5 rounded-full p-1 transition-colors", editing?.isOneOfAKind ? "bg-plum" : "bg-white/10")}>
                    <div className={cn("w-3 h-3 bg-white rounded-full transition-transform", editing?.isOneOfAKind ? "translate-x-5" : "translate-x-0")} />
                  </div>
                </button>
              </div>
            </div>

            <div className="p-10 bg-white/[0.02] border-t border-white/5 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-white/10 text-white/60 text-[10px] font-bold uppercase h-12 px-8 hover:bg-white/5"
                onClick={() => setIsEditorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-none bg-blue-600 text-white hover:bg-blue-500 text-[10px] font-bold uppercase h-12 px-10"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] uppercase font-bold tracking-widest text-white/40">{label}</Label>
      {children}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="py-32 flex flex-col items-center justify-center text-white/40 space-y-3">
      <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      <p className="text-[10px] font-bold uppercase tracking-widest italic">{label}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="py-32 flex flex-col items-center justify-center text-red-400 space-y-4">
      <AlertCircle className="w-8 h-8" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-center max-w-md px-6">{message}</p>
      <Button
        variant="outline"
        onClick={onRetry}
        className="h-10 rounded-none border-white/10 text-white/60 text-[9px] font-bold uppercase tracking-widest hover:bg-white/5"
      >
        Retry
      </Button>
    </div>
  );
}

function DashboardStat({
  label,
  value,
  icon,
  color = "text-white",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <Card className="bg-[#111113] border-white/5 p-8 space-y-4 group hover:border-blue-500/40 transition-all rounded-none shadow-xl">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20 group-hover:text-blue-400 transition-colors">
          {label}
        </span>
        <div className="text-white/20">
          {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 16 })}
        </div>
      </div>
      <div className={cn("text-4xl font-headline font-bold italic tabular", color)}>{value}</div>
    </Card>
  );
}
