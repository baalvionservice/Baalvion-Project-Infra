'use client';

/**
 * @file products/page.tsx
 * @description Buyer product catalog — browse/search live marketplace listings
 * (real trade-service /marketplace_listings resource, public + paginated).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { marketplaceService, MarketplaceListing } from '@/services/marketplace-service';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, PackageSearch, ShieldCheck } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export default function BuyerProductsPage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    marketplaceService.getListings({ search: search || undefined, category: category || undefined, type: 'offer' })
      .then((l) => { if (!cancelled) setListings(l); })
      .catch(() => { if (!cancelled) setListings([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, category]);

  const categories = Array.from(new Set(listings.map((l) => l.category))).filter(Boolean);

  return (
    <main className="space-y-8 p-4 md:p-8">
      <div className="space-y-1 border-b pb-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Marketplace</p>
        <h1 className="text-4xl font-black uppercase tracking-tighter">Products</h1>
        <p className="text-muted-foreground font-medium italic">Browse verified supplier offers across the global network.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
          <Input
            placeholder="Search products…"
            className="pl-12 h-12 border-2 rounded-2xl text-sm font-bold shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCategory('')}
              className={cn('px-4 h-12 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap', !category ? 'bg-primary text-white border-primary' : 'bg-background text-muted-foreground')}
            >All</button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn('px-4 h-12 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap', category === c ? 'bg-primary text-white border-primary' : 'bg-background text-muted-foreground')}
              >{c}</button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
      ) : listings.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6">
          <PackageSearch className="h-12 w-12 text-muted-foreground opacity-20" />
          <p className="text-sm font-bold text-muted-foreground">No products match your search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((l) => (
            <Link key={l.id} href={`/marketplace/listing/${l.id}`}>
              <Card className="h-full border-2 rounded-2xl hover:border-primary/40 transition-all cursor-pointer">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[9px] font-black uppercase">{l.category}</Badge>
                    {l.isVerified && (
                      <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight line-clamp-2">{l.title}</h3>
                    <p className="text-xs text-muted-foreground font-medium line-clamp-2 mt-1">{l.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-60">From</p>
                      <p className="text-sm font-black text-primary">{formatCurrency(l.basePrice ?? 0, l.currency)}</p>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{l.companyName}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
