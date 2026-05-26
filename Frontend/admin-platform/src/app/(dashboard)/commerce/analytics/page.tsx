'use client';

import { useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, Users, Package, DollarSign } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import KpiCard from '@/components/common/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrders, useCustomers } from '@/lib/queries/orders.queries';
import { useProducts } from '@/lib/queries/commerce-products.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatCurrency } from '@/lib/utils/format';

export default function CommerceAnalyticsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  const { data: ordersData, isLoading: loadingOrders } = useOrders(storeId, { limit: 1 });
  const { data: productsData, isLoading: loadingProducts } = useProducts(storeId, { limit: 1 });
  const { data: customersData, isLoading: loadingCustomers } = useCustomers(storeId, { limit: 1 });
  const { data: recentOrders, isLoading: loadingRecent } = useOrders(storeId, { limit: 10 });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Analytics' }]);
  }, [setBreadcrumbs]);

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Select a store from the Commerce overview to view analytics.</p>
        <Button asChild variant="outline"><Link href="/commerce">Go to Overview</Link></Button>
      </div>
    );
  }

  const totalOrders = ordersData?.pagination?.total ?? 0;
  const totalProducts = productsData?.pagination?.total ?? 0;
  const totalCustomers = customersData?.pagination?.total ?? 0;

  const orders = recentOrders?.data ?? [];
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commerce Analytics"
        description="Store performance and insights"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          title="Total Orders"
          value={totalOrders}
          icon={ShoppingCart}
          isLoading={loadingOrders}
        />
        <KpiCard
          title="Total Products"
          value={totalProducts}
          icon={Package}
          isLoading={loadingProducts}
        />
        <KpiCard
          title="Total Customers"
          value={totalCustomers}
          icon={Users}
          isLoading={loadingCustomers}
        />
        <KpiCard
          title="Avg Order Value"
          value={avgOrderValue}
          icon={DollarSign}
          format="currency"
          isLoading={loadingRecent}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenue (Last 10 Orders)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecent ? (
              <Skeleton className="h-32" />
            ) : orders.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No order data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="text-lg font-bold">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Orders Counted</span>
                  <span className="text-sm font-medium">{orders.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Order</span>
                  <span className="text-sm font-medium">{formatCurrency(avgOrderValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid Orders</span>
                  <span className="text-sm font-medium">
                    {orders.filter((o) => o.paymentStatus === 'paid').length}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order status breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Order Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecent ? (
              <Skeleton className="h-32" />
            ) : orders.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No data</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(
                  orders.reduce((acc, o) => {
                    acc[o.status] = (acc[o.status] ?? 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs capitalize">{status}</span>
                          <span className="text-xs font-medium">{count}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(count / orders.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm">Recent Orders</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
            <Link href="/commerce/orders">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loadingRecent ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No recent orders</p>
            </div>
          ) : (
            <div className="divide-y">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/commerce/orders/${o.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-mono">#{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{o.status}</p>
                  </div>
                  <span className="text-sm font-medium">{formatCurrency(o.totalAmount, o.currencyCode)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
