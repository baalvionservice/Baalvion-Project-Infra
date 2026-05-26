"use client"

import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  MessageSquare, 
  TrendingUp,
  Star,
  Gem,
  CheckCircle2,
  Building2,
  ClipboardList,
  Lightbulb
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { RelatedProducts } from "@/components/marketplace/RelatedProducts";
import { JsonLd } from "@/components/seo/JsonLd";

// Mock helper to simulate data fetching based on slug
const getProductData = (slug: string) => {
  return {
    id: slug,
    name: slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    grade: "Industrial Standard",
    origin: "Global Source",
    purity: "99.2%",
    moisture: "8.5% Max",
    quantity: "High Volume Available",
    minOrder: "5,000 MT",
    price: "105.40",
    currency: "USD",
    supplier: "GeoTrade Verified Partner",
    supplierRating: 4.8,
    description: `Premium industrial material optimized for global manufacturing. This batch of ${slug.replace(/-/g, ' ')} features exceptional consistency and minimal impurities. Verified for immediate export with all international documentation ready for transit.`,
    imageUrl: `https://picsum.photos/seed/${slug}/800/600`
  };
};

export default function ProductDetailPage() {
  const { productId } = useParams();
  const slug = Array.isArray(productId) ? productId[0] : productId || "unknown";
  const product = getProductData(slug);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.imageUrl,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": product.supplier
    },
    "offers": {
      "@type": "Offer",
      "url": `https://mining.baalvion.com/marketplace/${slug}`,
      "priceCurrency": product.currency,
      "price": product.price,
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <JsonLd data={productSchema} />
      <Navbar />
      
      <div className="bg-white border-b py-6">
        <div className="container px-4 md:px-8 max-w-7xl mx-auto space-y-4">
          <Breadcrumbs 
            items={[
              { label: "Marketplace", href: "/marketplace" },
              { label: product.name, href: `/marketplace/${slug}` }
            ]} 
          />
        </div>
      </div>

      <main className="container px-4 md:px-8 max-w-7xl mx-auto py-12 flex-1">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-8">
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl bg-muted border">
                <Image 
                  src={product.imageUrl} 
                  alt={`${product.name} technical grade specification`} 
                  fill 
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
                <div className="absolute top-6 left-6 flex gap-2">
                  <Badge className="bg-white/90 backdrop-blur text-primary border-none shadow-sm uppercase font-bold text-[10px] tracking-widest">
                    <ShieldCheck className="h-3 w-3 text-emerald-500 mr-1.5" /> Export Ready
                  </Badge>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h1 className="text-4xl font-headline font-bold text-slate-900">{product.name}</h1>
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-primary" /> {product.origin}</span>
                      <span className="flex items-center gap-1.5"><Gem className="h-4 w-4 text-secondary" /> Grade: {product.grade}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Market Reference</p>
                    <p className="text-4xl font-bold text-primary">${product.price}<span className="text-lg font-normal text-slate-400 ml-1">/MT</span></p>
                  </div>
                </div>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                  <CardHeader className="border-b bg-slate-50/50">
                    <CardTitle className="text-lg">Industrial Specifications</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="grid sm:grid-cols-3 gap-8">
                      {[
                        { label: "Purity", val: product.purity, icon: CheckCircle2 },
                        { label: "Moisture", val: product.moisture, icon: TrendingUp },
                        { label: "Minimum Order", val: product.minOrder, icon: ClipboardList },
                      ].map((spec, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <spec.icon className="h-3.5 w-3.5" /> {spec.label}
                          </div>
                          <p className="text-xl font-bold text-slate-900">{spec.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-8 border-t">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4">Detailed Description</h4>
                      <p className="text-slate-600 leading-relaxed">{product.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <RelatedProducts currentProductId={slug} />
          </div>

          <div className="space-y-8">
            <Card className="border-none shadow-xl bg-primary text-primary-foreground">
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Trade Negotiation</h3>
                  <p className="text-xs text-primary-foreground/60 leading-relaxed">
                    Initiate a formal RFQ to receive binding quotations and logistics routing options.
                  </p>
                </div>
                <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold h-12 shadow-lg group">
                  Request Quote <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" className="w-full bg-white/10 border-white/20 hover:bg-white/20 text-white font-bold h-12">
                  <MessageSquare className="mr-2 h-4 w-4" /> Message Supplier
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm overflow-hidden group">
              <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-lg">Supplier Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Building2 className="h-6 w-6 text-primary opacity-40" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{product.supplier}</h4>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-900">{product.supplierRating}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 font-medium">
                    Verified Tier 3 supplier with high fulfillment reliability.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-secondary" /> Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <p className="text-[10px] text-slate-500 uppercase font-bold px-1">Related Guides</p>
                <Link href="/guides/lithium-export-compliance-guide" className="block p-3 rounded-lg border hover:border-primary/30 transition-all group">
                  <p className="text-xs font-bold text-slate-700 group-hover:text-primary">Compliance Handbook</p>
                  <p className="text-[9px] text-slate-400 mt-1">Technical Standards & Documentation</p>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
