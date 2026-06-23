'use client';

import { useEffect } from 'react';
import { ShoppingBag, ShoppingCart, Package, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommerceStores } from '@/lib/queries/commerce-stores.queries';
import { useOrders } from '@/lib/queries/orders.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatCurrency } from '@/lib/utils/format';
import LiveVisitorsCard from '@/components/commerce/LiveVisitorsCard';
import type { CommerceStore } from '@/lib/types/commerce.types';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

const CURRENCY_FLAGS: Record<string, string> = {
  AED: '🇦🇪',
  INR: '🇮🇳',
  USD: '🇺🇸',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
};

export default function CommerceOverviewPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId, setActiveStore } = useCommerceStore();
  const { data: storesData, isLoading: loadingStores } = useCommerceStores({ limit: 10 });
  const { data: ordersData, isLoading: loadingOrders } = useOrders(
    activeStoreId ?? '',
    { limit: 5, status: 'pending' }
  );

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce' }]);
  }, [setBreadcrumbs]);

  const stores = storesData?.data ?? [];
  const activeStore = stores.find((s) => s.id === activeStoreId);
  const activeStores = stores.filter((s) => s.status === 'active').length;
  const pendingOrders = ordersData?.pagination?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commerce Overview"
        description="Manage your multi-country stores, products, and orders"
        actions={
          <Button size="sm" asChild>
            <Link href="/commerce/products">
              <Package className="mr-2 h-4 w-4" />
              Products
            </Link>
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            icon: ShoppingBag,
            label: 'Active Stores',
            value: loadingStores ? null : activeStores,
            sub: `of ${stores.length} total`,
          },
          {
            icon: ShoppingCart,
            label: 'Pending Orders',
            value: loadingOrders || !activeStoreId ? null : pendingOrders,
            sub: activeStoreId ? 'awaiting processing' : 'select a store',
            highlight: pendingOrders > 0,
          },
          {
            icon: Package,
            label: 'Stores',
            value: loadingStores ? null : (storesData?.pagination?.total ?? 0),
            sub: 'total registered',
          },
          {
            icon: TrendingUp,
            label: 'Countries',
            value: loadingStores ? null : new Set(stores.map((s) => s.countryCode)).size,
            sub: 'active markets',
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {kpi.value === null ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <p className={`text-2xl font-bold mt-1 ${kpi.highlight ? 'text-destructive' : ''}`}>
                      {kpi.value}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </div>
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stores list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Stores</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                <Link href="/commerce/settings">Manage</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingStores ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : stores.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No stores configured</p>
                  <Button size="sm" asChild>
                    <Link href="/commerce/settings">Create Store</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {stores.map((store: CommerceStore) => (
                    <button
                      key={store.id}
                      onClick={() => setActiveStore(store)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left ${activeStoreId === store.id ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-lg">
                          {CURRENCY_FLAGS[store.currencyCode] ?? '🏪'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{store.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {store.currencyCode} · {store.countryCode}
                            {store.timezone ? ` · ${store.timezone}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {activeStoreId === store.id && (
                          <Badge variant="outline" className="text-[10px] text-primary">Active</Badge>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[store.status] ?? ''}`}
                        >
                          {store.status}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          {/* Live shoppers on the selected storefront right now (polls every 15s). */}
          <LiveVisitorsCard storeId={activeStoreId} storeName={activeStore?.name} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Quick Access</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {[
                { href: '/commerce/orders', label: 'Orders', icon: ShoppingCart },
                { href: '/commerce/products', label: 'Products', icon: Package },
                { href: '/commerce/customers', label: 'Customers', icon: Users },
                { href: '/commerce/inventory', label: 'Inventory', icon: AlertTriangle },
                { href: '/commerce/discounts', label: 'Discounts', icon: TrendingUp },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
            </CardContent>
          </Card>

          {activeStoreId && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recent Pending Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingOrders ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                ) : (ordersData?.data ?? []).length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-xs text-muted-foreground">No pending orders</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {(ordersData?.data ?? []).slice(0, 5).map((order) => (
                      <Link
                        key={order.id}
                        href={`/commerce/orders/${order.id}`}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-medium">#{order.orderNumber}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {order.customer?.firstName ?? 'Guest'}
                          </p>
                        </div>
                        <p className="text-xs font-medium">
                          {formatCurrency(order.totalAmount, order.currencyCode)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
