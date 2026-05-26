"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, SlidersHorizontal, Gem, MapPin, ShieldCheck, ChevronRight, Globe, ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/monitoring";
import { products } from "@/lib/sitemap-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Global Marketplace Page.
 * Hardened for Accessibility and Production Performance.
 */

export default function MarketplacePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = new FormData(e.currentTarget).get('search')?.toString();
    trackEvent('search_performed', { query });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className="bg-primary py-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
          <Globe className="h-64 w-64" />
        </div>
        <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
          <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">International Trade Active</Badge>
          <h1 className="text-3xl md:text-5xl font-headline font-bold">Global Mineral Marketplace</h1>
          <p className="text-primary-foreground/70 max-w-2xl text-lg">Securely trade certified minerals with verified global suppliers.</p>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-12 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 space-y-6">
            <Card className="border-none shadow-sm sticky top-24">
              <CardContent className="p-6 space-y-6">
                <h2 className="font-bold text-primary flex items-center gap-2 border-b pb-4 text-sm uppercase tracking-widest">
                  <Filter className="h-4 w-4" /> Quick Filters
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="currency-select" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Base Currency</label>
                    <select id="currency-select" className="w-full h-12 px-3 rounded-md border text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                      <option>USD - US Dollar</option>
                      <option>EUR - Euro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="type-select" className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Material Type</label>
                    <select id="type-select" className="w-full h-12 px-3 rounded-md border text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none">
                      <option>All Minerals</option>
                      <option>Metallic</option>
                      <option>Industrial</option>
                    </select>
                  </div>
                </div>
                <Button className="w-full bg-secondary text-secondary-foreground font-bold shadow-md">Apply View</Button>
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1 space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleSearch} className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input 
                  name="search" 
                  placeholder="Search by mineral, grade, or origin..." 
                  className="pl-10 h-12 border-slate-200" 
                  aria-label="Search minerals"
                />
              </form>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-400">Sort by:</span>
                <Button variant="outline" className="gap-2 h-12 border-slate-200 font-bold">
                  <SlidersHorizontal className="h-4 w-4" /> Relevance
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((p, idx) => (
                <Link key={p.slug} href={`/marketplace/${p.slug}`} className="group block h-full">
                  <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all h-full flex flex-col">
                    <div className="relative h-48 bg-muted">
                      <Image 
                        src={`https://picsum.photos/seed/${p.slug}/400/300`} 
                        alt={`${p.slug.replace(/-/g, ' ')} high-grade industrial mineral`} 
                        fill 
                        priority={idx < 6}
                        loading={idx < 6 ? 'eager' : 'lazy'}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm uppercase tracking-widest">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" /> Verified
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-[10px] text-secondary font-bold uppercase tracking-wider">
                          <Gem className="h-3 w-3" /> Technical Grade
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors leading-tight">
                          {p.slug.replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> Verified Source</div>
                        <div className="font-bold text-primary">Market Rate</div>
                      </div>
                      <div className="pt-4">
                        <Button className="w-full bg-slate-100 text-slate-900 group-hover:bg-primary group-hover:text-white transition-colors font-bold h-12">
                          View Product <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-8">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 border-slate-200" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(prev => prev - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {[1, 2, 3, '...', totalPages].map((p, i) => (
                <Button 
                  key={i} 
                  variant={currentPage === p ? "default" : "outline"} 
                  className={cn("h-12 w-12 font-bold border-slate-200", currentPage === p ? "bg-primary" : "text-slate-500")}
                  disabled={typeof p === 'string'}
                  onClick={() => typeof p === 'number' && setCurrentPage(p)}
                  aria-current={currentPage === p ? "page" : undefined}
                >
                  {p}
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 border-slate-200" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(prev => prev + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </nav>
          </div>
        </div>
      </main>
    </div>
  );
}
