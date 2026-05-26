"use client"

import { useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  MapPin,
  Star,
  ShieldCheck,
  Gem,
  ChevronRight,
  Building2,
  SlidersHorizontal,
  Bell,
  ArrowUpDown,
  CheckCircle2,
  BookmarkPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/compliance/VerificationBadge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { marketplaceApi, type MineralProduct, type MiningCompany } from "@/lib/api-client";

/**
 * @fileOverview Search Results Page.
 * Fetches live results from mining-service via marketplaceApi.search().
 * Note: internal search results are marked as 'noindex' via the layout.
 */

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || "";

  const [products, setProducts] = useState<MineralProduct[]>([]);
  const [suppliers, setSuppliers] = useState<MiningCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);

    const result = await marketplaceApi.search({ query: q, page: 1, pageSize: 10 });

    if (result.ok) {
      setProducts(result.data.products ?? []);
      setSuppliers(result.data.suppliers ?? []);
      setTotal(result.data.total ?? 0);
    } else {
      setError(result.error.message);
      setProducts([]);
      setSuppliers([]);
      setTotal(0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    runSearch(query);
  }, [query, runSearch]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="bg-white border-b py-8">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-slate-900">
                Search Results for <span className="text-primary">"{query}"</span>
              </h1>
              {loading ? (
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching…
                </p>
              ) : (
                <p className="text-sm text-slate-500 mt-1">
                  Found {total} matching record{total !== 1 ? 's' : ''} across the platform.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 font-bold border-slate-200">
                <BookmarkPlus className="h-4 w-4 text-primary" /> Save Search
              </Button>
              <Button className="bg-primary text-white font-bold gap-2">
                <Bell className="h-4 w-4" /> Alert Me
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Advanced Filters Sidebar */}
          <aside className="lg:w-72 shrink-0 space-y-6">
            <Card className="border-none shadow-sm sticky top-24">
              <div className="border-b bg-slate-50/50 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" /> Advanced Filters
                  </h2>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary">Reset</Button>
                </div>
              </div>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Chemical Composition (%)</label>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Purity / Grade</span>
                        <span className="text-primary">60% - 100%</span>
                      </div>
                      <Slider defaultValue={[60]} max={100} step={1} className="py-2" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span>Max Moisture</span>
                        <span className="text-primary">8%</span>
                      </div>
                      <Slider defaultValue={[8]} max={25} step={0.5} className="py-2" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trust & Verification</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tier3" />
                      <label htmlFor="tier3" className="text-sm font-medium leading-none cursor-pointer">Tier 3 (Miner License)</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="exporter" />
                      <label htmlFor="exporter" className="text-sm font-medium leading-none cursor-pointer">Export Eligible</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="rating4" />
                      <label htmlFor="rating4" className="text-sm font-medium leading-none cursor-pointer">4.5+ Star Rating</label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t pt-6">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Geographic Origin</label>
                  <div className="space-y-1">
                    {["Africa", "Asia Pacific", "South America", "Europe"].map((reg) => (
                      <div key={reg} className="flex items-center justify-between py-1 group cursor-pointer">
                        <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{reg}</span>
                        <Badge variant="outline" className="text-[10px] h-4 border-slate-100 bg-slate-50">—</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold">Apply Advanced Filters</Button>
              </CardContent>
            </Card>
          </aside>

          {/* Results Area */}
          <div className="flex-1 space-y-6">
            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-1 gap-4">
                <TabsList className="bg-transparent h-auto p-0 gap-8">
                  {["All", "Products", "Suppliers", "RFQs"].map((t) => (
                    <TabsTrigger
                      key={t}
                      value={t.toLowerCase()}
                      className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-sm"
                    >
                      {t}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="gap-2 h-9 text-xs font-bold border border-slate-200">
                    <ArrowUpDown className="h-3.5 w-3.5" /> Relevance
                  </Button>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium">
                    Viewing {Math.min(total, 10)} of {total}
                  </span>
                </div>
              </div>

              {/* Error state */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>Search unavailable: {error}. Please try again.</span>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm font-medium">Searching the platform…</span>
                </div>
              )}

              {!loading && !error && (
                <TabsContent value="all" className="space-y-8 pt-6">
                  {products.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Gem className="h-4 w-4" /> Top Matching Minerals
                        </h3>
                        <Button variant="link" className="text-primary text-xs font-bold p-0">View All Products <ChevronRight className="h-3 w-3" /></Button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        {products.map((p) => (
                          <Card key={p.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-2 text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">
                                    <CheckCircle2 className="h-3 w-3" /> Grade: {p.grade || '—'}
                                  </div>
                                  <h4 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{p.name}</h4>
                                </div>
                                <div className="text-right">
                                  {p.pricePerMt ? (
                                    <>
                                      <p className="text-lg font-bold text-primary">${p.pricePerMt.toLocaleString()}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">per MT</p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-slate-400 font-medium">Market Rate</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-500 border-t pt-4">
                                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {p.origin || 'Verified Source'}</span>
                                {p.verifiedExporter && (
                                  <span className="flex items-center gap-1.5 font-bold text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" /> Export Ready</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {suppliers.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Building2 className="h-4 w-4" /> Verified Suppliers
                        </h3>
                        <Button variant="link" className="text-primary text-xs font-bold p-0">View Directory <ChevronRight className="h-3 w-3" /></Button>
                      </div>
                      <div className="grid gap-4">
                        {suppliers.map((s) => (
                          <Card key={s.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                              <div className="flex items-center gap-6">
                                <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                                  <Building2 className="h-6 w-6 text-primary opacity-40" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{s.name}</h4>
                                    <div className="flex items-center gap-1 text-amber-400">
                                      <Star className="h-3 w-3 fill-current" />
                                      <span className="text-xs font-bold text-slate-900">{s.rating}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {s.verifiedMiner && <VerificationBadge type="mining" />}
                                    {s.verifiedExporter && <VerificationBadge type="exporter" />}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="flex-1 text-center md:text-right">
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">Region</p>
                                  <p className="text-sm font-bold text-slate-700">{s.country}</p>
                                </div>
                                <Button variant="outline" size="sm" className="font-bold border-slate-200">View Profile</Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {products.length === 0 && suppliers.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-400">
                      <Search className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="font-medium">No results found for "{query}".</p>
                      <p className="text-sm mt-1">Try different keywords or post an RFQ.</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>

            <Card className="border-none shadow-sm bg-slate-100 border-2 border-dashed border-slate-200">
              <CardContent className="p-12 text-center flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-full shadow-sm">
                  <Search className="h-8 w-8 text-primary opacity-20" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Didn't find what you need?</h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">Try broadening your search terms or create a custom Procurement RFQ to attract new suppliers.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="font-bold border-slate-300">Clear All Filters</Button>
                  <Button className="bg-secondary text-secondary-foreground font-bold shadow-sm">Post a New RFQ</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen gap-2 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading Search Results…</div>}>
      <SearchContent />
    </Suspense>
  );
}
