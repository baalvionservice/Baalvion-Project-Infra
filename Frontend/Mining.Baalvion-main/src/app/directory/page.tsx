"use client"

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Building2,
  ArrowRightLeft,
  Globe,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/compliance/VerificationBadge";
import { JsonLd } from "@/components/seo/JsonLd";

const suppliers = [
  {
    id: "S-001",
    name: "Atlas Mining Co",
    country: "Australia",
    region: "Asia Pacific",
    minerals: ["Lithium", "Iron Ore"],
    rating: 4.9,
    reviews: 124,
    years: 15,
    verified: true,
    badges: ["mining", "exporter"],
    featured: true
  },
  {
    id: "S-002",
    name: "Zambia Copper Ltd",
    country: "Zambia",
    region: "Africa",
    minerals: ["Copper", "Cobalt"],
    rating: 4.7,
    reviews: 89,
    years: 8,
    verified: true,
    badges: ["mining", "exporter"],
    featured: false
  },
  {
    id: "S-003",
    name: "SinoTrade Minerals",
    country: "China",
    region: "Asia Pacific",
    minerals: ["Iron Ore", "Manganese"],
    rating: 4.5,
    reviews: 56,
    years: 12,
    verified: true,
    badges: ["company"],
    featured: false
  },
  {
    id: "S-004",
    name: "Andean Silver Corp",
    country: "Peru",
    region: "South America",
    minerals: ["Silver", "Zinc", "Lead"],
    rating: 4.8,
    reviews: 42,
    years: 20,
    verified: true,
    badges: ["mining", "exporter"],
    featured: true
  }
];

export default function SupplierDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [compareList, setCompareList] = useState<string[]>([]);

  const toggleCompare = (id: string) => {
    setCompareList(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const directorySchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Verified Mineral Suppliers",
      "itemListElement": suppliers.map((s, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Organization",
          "name": s.name,
          "address": {
            "@type": "PostalAddress",
            "addressCountry": s.country
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": s.rating,
            "reviewCount": s.reviews
          }
        }
      }))
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <JsonLd data={directorySchema} />
      <Navbar />
      
      <div className="bg-primary py-16 text-primary-foreground relative overflow-hidden">
        <div className="absolute right-0 top-0 p-12 opacity-10" aria-hidden="true">
          <Globe className="h-64 w-64" />
        </div>
        <div className="container relative z-10 px-4 md:px-8 max-w-7xl mx-auto space-y-4">
          <Badge className="bg-secondary/20 text-secondary border-secondary/30 mb-2">Verified Supplier Network</Badge>
          <h1 className="text-4xl md:text-5xl font-headline font-bold leading-tight">Global Supplier Directory</h1>
          <p className="text-primary-foreground/70 max-w-2xl text-lg leading-relaxed">
            Discover and connect with vetted mining companies and industrial exporters. Filter by mineral type, country, and compliance level.
          </p>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-12 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-72 space-y-6">
            <Card className="border-none shadow-sm sticky top-24">
              <CardHeader className="border-b bg-slate-50/50">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Filter className="h-4 w-4" /> Directory Filters
                </h2>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-4">
                  <label htmlFor="directory-search" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Search Company</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
                    <Input 
                      id="directory-search"
                      placeholder="Name or mineral..." 
                      className="pl-9 h-12 border-slate-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Trade Region</p>
                  <div className="space-y-1" role="group" aria-label="Filter by region">
                    {["All", "Africa", "Asia Pacific", "South America", "Europe", "North America"].map((reg) => (
                      <button
                        key={reg}
                        onClick={() => setSelectedRegion(reg)}
                        className={cn(
                          "w-full text-left px-3 py-3 rounded-lg text-sm font-bold transition-colors flex items-center justify-between group h-12",
                          selectedRegion === reg ? "bg-primary text-white" : "hover:bg-slate-50 text-slate-600"
                        )}
                        aria-pressed={selectedRegion === reg}
                      >
                        {reg}
                        {selectedRegion === reg && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label htmlFor="cat-select" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mineral Category</label>
                  <select id="cat-select" className="w-full h-12 px-3 rounded-md border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none">
                    <option>All Categories</option>
                    <option>Metallic Minerals</option>
                    <option>Industrial Minerals</option>
                    <option>Stone & Aggregates</option>
                  </select>
                </div>

                <Button className="w-full bg-secondary text-secondary-foreground font-bold shadow-md h-12">Apply Advanced Filters</Button>
              </CardContent>
            </Card>
          </aside>

          <div className="flex-1 space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500 font-medium">
                Found <span className="font-bold text-slate-900">{suppliers.length}</span> verified suppliers in the network.
              </div>
              {compareList.length > 0 && (
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 w-full sm:w-auto">
                  <span className="text-xs font-bold text-primary">{compareList.length} of 3 selected</span>
                  <Link href={`/directory/compare?ids=${compareList.join(',')}`} className="flex-1 sm:flex-none">
                    <Button size="sm" className="w-full bg-secondary text-secondary-foreground font-bold gap-2 h-10 px-6">
                      <ArrowRightLeft className="h-4 w-4" /> Compare Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            <div className="grid gap-6">
              {suppliers.map((s) => (
                <Card key={s.id} className={cn(
                  "border-none shadow-sm hover:shadow-md transition-all group overflow-hidden border-l-4",
                  s.featured ? "border-l-secondary" : "border-l-transparent"
                )}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">{s.name}</h3>
                              {s.featured && <Badge className="bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border-secondary/20">Featured</Badge>}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {s.country}, {s.region}</span>
                              <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-slate-400" /> {s.years} Years in Op</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {s.badges.map((badge: any) => (
                              <VerificationBadge key={badge} type={badge} />
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {s.minerals.map((m) => (
                            <span key={m} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">{m}</span>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-6 pt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex" aria-label={`Rating: ${s.rating} out of 5 stars`}>
                              {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className={cn("h-3.5 w-3.5", i <= Math.floor(s.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200")} aria-hidden="true" />
                              ))}
                            </div>
                            <span className="text-sm font-bold text-slate-900">{s.rating}</span>
                            <span className="text-xs text-slate-400">({s.reviews} reviews)</span>
                          </div>
                          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> 100% On-Time Delivery
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-48">
                        <Link href={`/directory/${s.id}`} className="w-full">
                          <Button variant="outline" className="w-full font-bold border-slate-200 group-hover:border-primary group-hover:text-primary transition-colors h-12">
                            View Profile
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          onClick={() => toggleCompare(s.id)}
                          className={cn(
                            "w-full text-xs font-bold gap-2 h-12",
                            compareList.includes(s.id) ? "text-secondary" : "text-slate-500"
                          )}
                          aria-pressed={compareList.includes(s.id)}
                        >
                          <ArrowRightLeft className="h-3.5 w-3.5" /> 
                          {compareList.includes(s.id) ? "Remove Compare" : "Compare Supplier"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <Link href="/contact">
                <Button variant="outline" className="px-12 border-slate-300 font-bold h-12 text-slate-600">Request Supplier Introductions</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
