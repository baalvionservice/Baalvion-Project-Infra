
"use client"

import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Star, 
  ShieldCheck, 
  Building2, 
  MessageSquare, 
  ClipboardList, 
  Globe, 
  Pickaxe, 
  Award,
  FileText,
  Package,
  ChevronRight,
  TrendingUp,
  History
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/compliance/VerificationBadge";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";

// Mock helper to simulate supplier fetching based on slug
const getSupplierData = (slug: string) => {
  return {
    id: slug,
    name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    tagline: `Leading producer of industrial minerals serving the ${slug.includes('asia') ? 'Asia Pacific' : 'Global'} market.`,
    country: "Verified Region",
    region: "Global Supply Chain",
    headquarters: "Trade Center",
    rating: 4.9,
    reviewsCount: 142,
    about: "A premier mineral extraction and export company committed to sustainable industrial supply. We maintain Tier 3 verified status with automated compliance reporting and IoT-tracked logistics.",
    stats: [
      { label: "Total Shipments", val: "1,240 MT", icon: Package },
      { label: "Active Listings", val: "14", icon: Pickaxe },
      { label: "Contracts", val: "42", icon: FileText },
      { label: "Trust Score", val: "98/100", icon: ShieldCheck },
    ],
    minerals: [
      { name: "Bulk Aggregate", grade: "Standard", status: "In Stock", slug: "bulk-aggregate" },
      { name: "Industrial Grade", grade: "Premium", status: "In Stock", slug: "industrial-grade" },
    ],
    certifications: [
      { name: "ISO 9001:2015", issuer: "Bureau Veritas", date: "2023" },
      { name: "Responsible Sourcing", issuer: "IRMA", date: "2023" },
    ]
  };
};

export default function SupplierProfilePage() {
  const { supplierId } = useParams();
  const slug = Array.isArray(supplierId) ? supplierId[0] : supplierId || "unknown";
  const supplier = getSupplierData(slug);

  const supplierSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": supplier.name,
    "description": supplier.about,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": supplier.country
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": supplier.rating,
      "reviewCount": supplier.reviewsCount
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={supplierSchema} />
      <Navbar />
      
      <div className="bg-white border-b py-12">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto space-y-6">
          <Breadcrumbs 
            items={[
              { label: "Suppliers", href: "/directory" },
              { label: supplier.name, href: `/directory/${slug}` }
            ]} 
          />
          
          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="h-32 w-32 rounded-3xl bg-primary/5 flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
              <Building2 className="h-16 w-16 text-primary opacity-20" />
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-headline font-bold text-slate-900">{supplier.name}</h1>
                <div className="flex gap-2">
                  <VerificationBadge type="mining" />
                  <VerificationBadge type="exporter" />
                </div>
              </div>
              <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">{supplier.tagline}</p>
              <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 pt-2">
                <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {supplier.country}</span>
                <span className="flex items-center gap-2 text-primary font-bold"><Globe className="h-4 w-4" /> Verified Export</span>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-slate-900">{supplier.rating}</span>
                  <span className="text-slate-400">({supplier.reviewsCount} reviews)</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-64">
              <Button className="bg-primary text-white font-bold gap-2 h-12 shadow-lg">
                <MessageSquare className="h-4 w-4" /> Message Company
              </Button>
              <Button variant="outline" className="border-slate-200 font-bold gap-2 h-12">
                <ClipboardList className="h-4 w-4" /> Invite to RFQ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-12 flex-1">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {supplier.stats.map((stat, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-primary/5 rounded-lg text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-lg font-bold text-slate-900">{stat.val}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-8">
                {["Overview", "Products", "Compliance"].map((t) => (
                  <TabsTrigger 
                    key={t}
                    value={t.toLowerCase()} 
                    className="px-0 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent font-bold text-sm"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview" className="space-y-8 pt-4">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 uppercase italic tracking-tighter border-l-4 border-primary pl-4">Company Overview</h3>
                  <p className="text-slate-600 leading-relaxed font-medium">{supplier.about}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  <Card className="border-none shadow-sm bg-primary text-primary-foreground">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-secondary" /> Performance Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm opacity-80">Excellent fulfillment history with high precision in grade delivery.</p>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-2xl font-bold">100%</p>
                          <p className="text-[9px] uppercase font-bold opacity-60">Compliance</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">48h</p>
                          <p className="text-[9px] uppercase font-bold opacity-60">Avg. Response</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="products" className="pt-4">
                <div className="grid sm:grid-cols-2 gap-6">
                  {supplier.minerals.map((m, idx) => (
                    <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all group">
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{m.name}</h4>
                          <p className="text-xs text-slate-500">{m.grade} Grade</p>
                        </div>
                        <Link href={`/marketplace/${m.slug}`}>
                          <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase border border-slate-100 gap-2">
                            View Listing <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> Verified Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {supplier.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{cert.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{cert.issuer} • {cert.date}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <History className="h-48 w-48" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">Supply Chain Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <p className="text-sm text-slate-400">
                  Reliable logistics tracking and quality validation reports available for all bulk orders.
                </p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 border-none">
                  Request Preferred Partner Quote
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
