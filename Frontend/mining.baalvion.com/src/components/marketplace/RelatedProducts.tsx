"use client"

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gem, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { marketplaceApi, type MineralProduct } from "@/lib/api-client";
import { BRAND_IMAGES } from "@/lib/brand-assets";

interface RelatedProductsProps {
  currentProductId: string;
  category?: string;
}

/**
 * @fileOverview Internal Linking Engine for Marketplace.
 * Connects related mineral products to improve crawl depth and SEO authority distribution.
 * Data is fetched from mining-service via marketplaceApi.relatedBySlug().
 */
export function RelatedProducts({ currentProductId, category: _category }: RelatedProductsProps) {
  const [related, setRelated] = useState<MineralProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await marketplaceApi.relatedBySlug(currentProductId, 3);

      if (cancelled) return;

      if (result.ok) {
        setRelated(result.data);
      } else {
        setError(result.error.message);
      }
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [currentProductId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-xl font-headline font-bold text-slate-900 uppercase italic tracking-tighter">
            Related <span className="text-primary">Minerals</span>
          </h3>
        </div>
        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">Loading related products…</span>
        </div>
      </div>
    );
  }

  if (error || related.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-xl font-headline font-bold text-slate-900 uppercase italic tracking-tighter">
            Related <span className="text-primary">Minerals</span>
          </h3>
          <Link href="/marketplace" className="text-xs font-bold text-primary hover:underline">
            Browse All Commodities
          </Link>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Could not load related products. <Link href="/marketplace" className="text-primary hover:underline font-bold">Browse all</Link></span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="text-xl font-headline font-bold text-slate-900 uppercase italic tracking-tighter">
          Related <span className="text-primary">Minerals</span>
        </h3>
        <Link href="/marketplace" className="text-xs font-bold text-primary hover:underline">
          Browse All Commodities
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {related.map((p) => (
          <Card key={p.slug} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="relative h-32 bg-slate-100">
              <Image
                src={p.imageUrl || BRAND_IMAGES.mineral}
                alt={`Premium ${p.name} for industrial export`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <CardContent className="p-4 space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                  <Gem className="h-3 w-3" /> {p.grade || 'Technical Grade'}
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                  {p.name}
                </h4>
              </div>
              <Link href={`/marketplace/${p.slug}`} className="block">
                <Button variant="ghost" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest border border-slate-100 hover:bg-primary hover:text-white transition-all gap-2">
                  Analyze Grade <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
