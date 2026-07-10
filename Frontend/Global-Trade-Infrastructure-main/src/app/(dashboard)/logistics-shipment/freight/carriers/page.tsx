'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCarriers } from '@/api';
import { FreightNavTabs } from '../_components/freight-nav-tabs';
import { modeMeta } from '../_components/mode-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Star, ShieldCheck, Radio, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CarrierMarketplacePage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useCarriers({ status: 'active' });
  const carriers = (data?.items ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Carrier Marketplace</h1>
        <p className="text-sm text-muted-foreground">Browse and compare every active carrier in the directory — coded integrations and dynamically registered providers alike.</p>
      </div>

      <FreightNavTabs />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search carriers…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-10 text-center">Loading carriers…</p>}
      {!isLoading && carriers.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No active carriers found. <Link href="/logistics-shipment/freight/carriers/manage" className="text-primary underline">Register one</Link>.</CardContent></Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {carriers.map((carrier) => (
          <Link key={carrier.id} href={`/logistics-shipment/freight/carriers/manage/${carrier.id}`}>
            <Card className="h-full hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{carrier.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wide">{carrier.code}</p>
                  </div>
                  {carrier.connectorKey ? (
                    <Badge variant="verified" className="text-[8px]"><ShieldCheck className="h-2.5 w-2.5 mr-0.5" />Integrated</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px]">Manual</Badge>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" /> {carrier.rating != null ? carrier.rating.toFixed(1) : '—'}</span>
                  <span className="text-muted-foreground">{carrier.reliabilityScore}% reliable</span>
                  {carrier.performanceScore != null && <span className="text-muted-foreground">Score {carrier.performanceScore.toFixed(0)}</span>}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(carrier.modes ?? []).map((mode) => {
                    const meta = modeMeta(mode);
                    return (
                      <span key={mode} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[9px] font-bold">
                        <meta.icon className={cn('h-2.5 w-2.5', meta.color)} /> {meta.label}
                      </span>
                    );
                  })}
                  {(!carrier.modes || carrier.modes.length === 0) && <span className="text-[9px] text-muted-foreground italic">No modes configured</span>}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t text-[10px] text-muted-foreground">
                  {carrier.trackingApiSupported && <span className="flex items-center gap-1"><Radio className="h-3 w-3" /> Live tracking</span>}
                  {carrier.country && <span>{carrier.country}</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
