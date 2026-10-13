'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { Store, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCommerceStores } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';

// Amarisé is the main storefront, so it is what Commerce opens on. Anything else is one click away.
const DEFAULT_STORE_CODE = 'amarise';

export default function CommerceLayout({ children }: { children: ReactNode }) {
  const { activeStoreId, setActiveStore } = useCommerceStore();
  const { data, isLoading, isError } = useCommerceStores({ limit: 200 });
  const stores = data?.data ?? [];
  const active = stores.find((s) => s.id === activeStoreId);

  // Pick a store automatically so every Commerce page has one — the old behaviour left Products,
  // Categories and Orders reading "select a store first" until you found the overview card.
  useEffect(() => {
    if (!stores.length || active) return;
    const preferred = stores.find((s) => s.code?.toLowerCase() === DEFAULT_STORE_CODE) ?? stores[0];
    setActiveStore(preferred);
  }, [stores, active, setActiveStore]);

  if (isLoading) return <Skeleton className="h-24 w-full" />;

  if (isError || stores.length === 0) {
    return (
      <Card className="border-amber-300/60">
        <CardContent className="flex gap-4 py-8">
          <Lock className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
          <div className="space-y-2 text-sm">
            <p className="text-base font-semibold">{isError ? 'Commerce could not be loaded' : 'No stores are visible to this account'}</p>
            <p className="text-muted-foreground">
              {isError
                ? 'The Commerce service did not respond. Try again in a moment.'
                : 'The stores exist, but Commerce only shows them to accounts with a platform or country role in Team Management. Being a super admin of the console is not enough on its own.'}
            </p>
            {!isError && (
              <p className="text-muted-foreground">
                Sign in with an account that has commerce access, or ask a platform super admin to grant this one in{' '}
                <Link href="/rbac" className="text-primary underline">Team Management</Link>.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <Store className="h-4 w-4 text-primary" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Store</span>
        <Select value={active?.id ?? ''} onValueChange={(id) => { const s = stores.find((x) => x.id === id); if (s) setActiveStore(s); }}>
          <SelectTrigger className="h-8 w-full max-w-xs sm:w-72"><SelectValue placeholder="Choose a store" /></SelectTrigger>
          <SelectContent>
            {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.countryCode}</SelectItem>)}
          </SelectContent>
        </Select>
        {active && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{active.currencyCode}</Badge>
            <Badge variant="outline">{active.countryCode}</Badge>
            <Badge variant="outline" className="capitalize">{active.status}</Badge>
          </div>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{stores.length} {stores.length === 1 ? 'store' : 'stores'}</span>
      </div>
      {children}
    </div>
  );
}
