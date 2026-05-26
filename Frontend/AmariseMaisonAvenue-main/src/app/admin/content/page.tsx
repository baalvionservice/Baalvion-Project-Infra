"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  History,
  Edit3,
  Trash2,
  Package,
  ChevronRight,
  Database,
  CheckCircle2,
  Lock,
  Eye,
  Crown,
  X,
  Save,
  Tag,
  Globe,
  Zap,
  ShieldCheck,
  AlertCircle,
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
import { useCMS } from "@/hooks/use-cms";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/use-search";
import { useToast } from "@/hooks/use-toast";
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
import { Product } from "@/lib/types";
import { useAISEO } from "@/hooks/use-ai";

/**
 * Atelier CMS: Multi-Market Registry Terminal
 * Control artifact template strategy (Normal vs Private) and regional visibility.
 * Enhanced with SEO Authority suite.
 */
export default function ContentAdminHub() {
  const { products, removeProduct } = useCMS();
  const { lockProductForEditing, toggleProductVipStatus, upsertProduct } =
    useAppStore();
  const { auditPageSEO, optimizeMetadata } = useAISEO();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [seoAudit, setSeoAudit] = useState<{
    score: number;
    missingKeywords: string[];
    suggestion: string;
  } | null>(null);

  const filteredProducts = useSearch(products, searchQuery);

  const handleEditArtifact = (product: Product) => {
    const locked = lockProductForEditing(product.id);
    if (locked) {
      setEditingProduct({ ...product });
      setIsEditorOpen(true);
      setSeoAudit(null);
    } else {
      toast({
        variant: "destructive",
        title: "Conflict Blocked",
        description: "Refined by another hub.",
      });
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      upsertProduct(
        editingProduct,
        `Modified Registry Entry: ${editingProduct.name}`
      );
      setIsEditorOpen(false);
      setEditingProduct(null);
      toast({
        title: "Registry Updated",
        description: "Artifact metadata synchronized across hubs.",
      });
    }
  };

  const handleToggleTemplate = (productId: string) => {
    toggleProductVipStatus(productId);
    toast({
      title: "Acquisition Strategy Updated",
      description: "The artifact template has been re-routed.",
    });
  };

  const runSEOAudit = () => {
    if (!editingProduct) return;
    const res = auditPageSEO(
      `${editingProduct.name} ${editingProduct.specialNotes || ""}`,
      editingProduct.targetKeyword
        ? [editingProduct.targetKeyword]
        : ["luxury", "heritage"]
    );
    setSeoAudit(res);
    toast({
      title: "SEO Audit Complete",
      description: `Registry entry scored ${res.score}% for Google relevance.`,
    });
  };

  const generateAISEO = () => {
    if (!editingProduct) return;
    const suggested = optimizeMetadata(editingProduct.name, "Global");
    if (suggested) {
      setEditingProduct({
        ...editingProduct,
        seoTitle: suggested.metaTitle,
        seoDescription: suggested.metaDesc,
        targetKeyword: suggested.keywords.split(",")[0],
      });
      toast({
        title: "AI SEO Suggestions Applied",
        description: "Metadata has been optimized for Google search.",
      });
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <nav className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center space-x-2 mb-2">
            <Link href="/admin" className="hover:text-plum transition-colors">
              Admin
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Products</span>
            <span className="text-slate-300">/</span>
            <span className="text-plum">Atelier CMS</span>
          </nav>
          <h1 className="text-3xl font-headline font-bold text-slate-900 uppercase tracking-tight">
            Atelier Registry
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Manage the global master catalog, pricing, stock, and acquisition
            template strategy.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="bg-plum hover:bg-black text-white font-bold uppercase tracking-widest text-[10px] h-11 px-8 rounded-none shadow-lg transition-all"
            onClick={() => {
              setEditingProduct({
                id: `prod-${Date.now()}`,
                name: "New Artifact Entry",
                departmentId: "women",
                categoryId: "w-bags",
                subcategoryId: "top-handle",
                collectionId: "heritage",
                basePrice: 0,
                imageUrl: "https://picsum.photos/seed/new/800/1000",
                isVip: false,
                rating: 5.0,
                reviewsCount: 0,
                stock: 1,
                brandId: "amarise-luxe",
                isGlobal: true,
                scope: "global",
                regions: ["us", "uk", "ae", "in", "sg"],
                status: "draft",
                versionHistory: [],
                currentVersion: 1,
                conflictStrategy: "global-priority",
                lastEditedRegion: "global",
                seoTitle: "",
                seoDescription: "",
                targetKeyword: "",
              });
              setIsEditorOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Register New Entry
          </Button>
        </div>
      </header>

      {/* Editor Drawer */}
      <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <SheetContent className="w-full sm:max-w-[640px] bg-white p-0 border-none rounded-none shadow-2xl">
          <form onSubmit={handleSaveProduct} className="flex flex-col h-full">
            <SheetHeader className="p-10 bg-slate-50 border-b border-slate-100">
              <SheetTitle className="font-headline text-3xl uppercase italic tracking-tighter">
                Edit Registry Artifact
              </SheetTitle>
              <SheetDescription className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Master Metadata Control
              </SheetDescription>
            </SheetHeader>

            <Tabs
              defaultValue="core"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="bg-white border-b border-slate-100 h-14 w-full justify-start p-0 px-10 rounded-none space-x-8">
                <TabsTrigger value="core" className="tab-trigger-modern !h-14">
                  Core Details
                </TabsTrigger>
                <TabsTrigger value="seo" className="tab-trigger-modern !h-14">
                  SEO Authority
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <TabsContent
                  value="core"
                  className="m-0 space-y-8 animate-fade-in"
                >
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      Artifact Name
                    </Label>
                    <Input
                      value={editingProduct?.name}
                      onChange={(e) =>
                        setEditingProduct((prev) =>
                          prev ? { ...prev, name: e.target.value } : null
                        )
                      }
                      className="rounded-none border-slate-200 h-12 text-sm italic font-light"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Base Price (Global)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">
                          $
                        </span>
                        <Input
                          type="number"
                          value={editingProduct?.basePrice}
                          onChange={(e) =>
                            setEditingProduct((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    basePrice: parseFloat(e.target.value),
                                  }
                                : null
                            )
                          }
                          className="rounded-none border-slate-200 h-12 pl-8 text-sm font-bold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Current Stock
                      </Label>
                      <Input
                        type="number"
                        value={editingProduct?.stock}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev
                              ? { ...prev, stock: parseInt(e.target.value) }
                              : null
                          )
                        }
                        className="rounded-none border-slate-200 h-12 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-plum">
                      Acquisition Protocol
                    </p>
                    <div
                      className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 group cursor-pointer"
                      onClick={() =>
                        editingProduct &&
                        setEditingProduct({
                          ...editingProduct,
                          isVip: !editingProduct.isVip,
                        })
                      }
                    >
                      <div className="flex items-center space-x-4">
                        {editingProduct?.isVip ? (
                          <Lock className="w-5 h-5 text-plum" />
                        ) : (
                          <Eye className="w-5 h-5 text-slate-400" />
                        )}
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight text-slate-900">
                            {editingProduct?.isVip
                              ? "Private Salon Flow"
                              : "Normal Registry Flow"}
                          </p>
                          <p className="text-[10px] text-slate-400 italic">
                            Toggle to switch acquisition persona.
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "w-10 h-5 rounded-full p-1 transition-colors",
                          editingProduct?.isVip ? "bg-plum" : "bg-slate-200"
                        )}
                      >
                        <div
                          className={cn(
                            "w-3 h-3 bg-white rounded-full transition-transform",
                            editingProduct?.isVip
                              ? "translate-x-5"
                              : "translate-x-0"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                      Curatorial Notes
                    </Label>
                    <Textarea
                      value={editingProduct?.specialNotes}
                      onChange={(e) =>
                        setEditingProduct((prev) =>
                          prev
                            ? { ...prev, specialNotes: e.target.value }
                            : null
                        )
                      }
                      className="rounded-none border-slate-200 min-h-[120px] text-xs italic font-light leading-relaxed"
                      placeholder="Detail the provenance and rarity..."
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="seo"
                  className="m-0 space-y-10 animate-fade-in"
                >
                  <div className="bg-plum/5 p-6 border border-plum/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-plum">
                        <Zap className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          AI SEO Optimization
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-[8px] font-bold uppercase border-plum/20 text-plum hover:bg-plum hover:text-white"
                        onClick={generateAISEO}
                      >
                        GENERATE METADATA
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      "Automate the crafting of market-specific descriptors for
                      Google indexing."
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        SEO Title (Google Display)
                      </Label>
                      <Input
                        value={editingProduct?.seoTitle}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev ? { ...prev, seoTitle: e.target.value } : null
                          )
                        }
                        className="rounded-none border-slate-200 h-12 text-xs font-bold"
                        placeholder="Ex: Hermes Birkin 25 Gold | Maison Amarisé Global Registry"
                      />
                      <p className="text-[8px] text-slate-400 text-right uppercase font-bold">
                        Limit: 60 Characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Meta Description
                      </Label>
                      <Textarea
                        value={editingProduct?.seoDescription}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev
                              ? { ...prev, seoDescription: e.target.value }
                              : null
                          )
                        }
                        className="rounded-none border-slate-200 h-24 text-xs italic"
                        placeholder="Detail the acquisition value for search results..."
                      />
                      <p className="text-[8px] text-slate-400 text-right uppercase font-bold">
                        Limit: 160 Characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Target SEO Keyword
                      </Label>
                      <Input
                        value={editingProduct?.targetKeyword}
                        onChange={(e) =>
                          setEditingProduct((prev) =>
                            prev
                              ? { ...prev, targetKeyword: e.target.value }
                              : null
                          )
                        }
                        className="rounded-none border-slate-200 h-12 text-xs font-mono"
                        placeholder="Ex: hermes birkin investment"
                      />
                    </div>
                  </div>

                  {/* SEO Audit Result */}
                  {seoAudit ? (
                    <div
                      className={cn(
                        "p-8 border space-y-6",
                        seoAudit.score > 80
                          ? "bg-green-50 border-green-100"
                          : "bg-orange-50 border-orange-100"
                      )}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <ShieldCheck
                            className={cn(
                              "w-5 h-5",
                              seoAudit.score > 80
                                ? "text-green-600"
                                : "text-orange-600"
                            )}
                          />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Authority Audit Score
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-2xl font-headline font-bold italic",
                            seoAudit.score > 80
                              ? "text-green-600"
                              : "text-orange-600"
                          )}
                        >
                          {seoAudit.score}%
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Specialist Suggestion
                        </p>
                        <p className="text-xs italic leading-relaxed text-slate-700">
                          "{seoAudit.suggestion}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-14 border-dashed border-slate-200 text-[10px] font-bold uppercase tracking-widest hover:border-plum hover:text-plum"
                      onClick={runSEOAudit}
                    >
                      <Globe className="w-4 h-4 mr-2" /> AUDIT FOR SEARCH
                      AUTHORITY
                    </Button>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-none border-slate-200 text-[10px] font-bold uppercase h-12 px-8"
                onClick={() => setIsEditorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-none bg-plum text-white hover:bg-black text-[10px] font-bold uppercase h-12 px-10 shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" /> Sync to Registry
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden rounded-none">
        <Tabs defaultValue="registry" className="w-full">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-0">
            <div className="px-8 pt-6 pb-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <TabsList className="bg-transparent h-auto p-0 space-x-8 rounded-none border-b-0">
                <TabsTrigger value="registry" className="tab-trigger-modern">
                  All Artifacts
                </TabsTrigger>
                <TabsTrigger value="private" className="tab-trigger-modern">
                  Private Salon Only
                </TabsTrigger>
                <TabsTrigger value="normal" className="tab-trigger-modern">
                  Registry Standard
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-4 pb-4">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 transition-colors group-focus-within:text-plum" />
                  <input
                    type="text"
                    placeholder="Filter registry..."
                    className="bg-white border border-slate-200 h-9 pl-9 pr-4 text-xs rounded-none w-64 focus:ring-4 focus:ring-plum/5 focus:border-plum outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-none"
                >
                  <Filter className="w-3.5 h-3.5 mr-2" /> Filters
                </Button>
              </div>
            </div>
          </CardHeader>

          <TabsContent
            value="registry"
            className="m-0 border-none outline-none"
          >
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100">
                  <TableHead className="text-[10px] uppercase font-bold text-slate-400 pl-8">
                    Artifact Information
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-400">
                    Stock & Price
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-400">
                    Acquisition Strategy
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-slate-400 text-right pr-8">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.slice(0, 15).map((prod) => (
                  <TableRow
                    key={prod.id}
                    className="hover:bg-slate-50/50 group transition-colors border-slate-50"
                  >
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-14 bg-slate-100 rounded-none border border-slate-200 flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-400 uppercase">
                          Asset
                        </div>
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-plum transition-colors uppercase tracking-tight">
                            {prod.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">
                            REF: {prod.id.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-bold text-slate-900">
                          ${prod.basePrice.toLocaleString()}
                        </span>
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase",
                            prod.stock < 5 ? "text-red-500" : "text-slate-400"
                          )}
                        >
                          {prod.stock} IN STOCK
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleTemplate(prod.id)}
                        className="flex items-center space-x-3 group/strategy"
                      >
                        <Badge
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-widest border-none px-3 py-1 rounded-none",
                            prod.isVip
                              ? "bg-plum text-white"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {prod.isVip ? (
                            <Lock className="w-2.5 h-2.5 mr-1.5" />
                          ) : (
                            <Eye className="w-2.5 h-2.5 mr-1.5" />
                          )}
                          {prod.isVip ? "PRIVATE SALON" : "NORMAL REGISTRY"}
                        </Badge>
                        <span className="text-[8px] font-bold text-slate-300 group-hover/strategy:text-plum transition-colors uppercase tracking-widest opacity-0 group-hover/strategy:opacity-100">
                          Switch
                        </span>
                      </button>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-plum hover:bg-plum/5"
                          onClick={() => handleEditArtifact(prod)}
                        >
                          <Edit3 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-900"
                        >
                          <History size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeProduct(prod.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                Showing 15 of {products.length} Registry Entries
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-none disabled:opacity-30"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-none"
                >
                  Next Page
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
