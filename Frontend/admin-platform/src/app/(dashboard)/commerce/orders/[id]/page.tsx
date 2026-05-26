'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package, MapPin, CreditCard, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrder, useUpdateOrderStatus, useCancelOrder } from '@/lib/queries/orders.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import type { Order } from '@/lib/types/order.types';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: order, isLoading } = useOrder(storeId, params.id);
  const updateStatus = useUpdateOrderStatus(storeId);
  const cancelOrder = useCancelOrder(storeId);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Commerce', href: '/commerce' },
      { label: 'Orders', href: '/commerce/orders' },
      { label: order ? `#${order.orderNumber}` : 'Loading...' },
    ]);
  }, [setBreadcrumbs, order?.orderNumber]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/commerce/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];

  const addr = order.shippingAddress;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/commerce/orders"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
            </Button>
            {allowed.filter((s) => s !== 'cancelled').length > 0 && (
              <Select
                value={order.status}
                onValueChange={(status) =>
                  updateStatus.mutate({ orderId: order.id, status: status as Order['status'] })
                }
              >
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={order.status} disabled>{order.status}</SelectItem>
                  {allowed
                    .filter((s) => s !== 'cancelled')
                    .map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
            {allowed.includes('cancelled') && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Order
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <StatusBadge status={order.status} />
        <Badge variant="outline" className="capitalize">{order.paymentStatus.replace('_', ' ')}</Badge>
        <Badge variant="secondary" className="capitalize">{order.fulfillmentStatus}</Badge>
        <Badge variant="secondary">{order.currencyCode}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Line items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Items ({(order.items ?? []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(order.items ?? []).length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No items</p>
              ) : (
                <div className="divide-y">
                  {order.items!.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        {item.variantName && (
                          <p className="text-xs text-muted-foreground">{item.variantName}</p>
                        )}
                        <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{item.quantity} × {formatCurrency(item.price, order.currencyCode)}</p>
                        <p className="text-sm font-medium">{formatCurrency(item.total, order.currencyCode)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-3 border-t space-y-1.5 bg-muted/30">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal, order.currencyCode)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Discount {order.discountCode ? `(${order.discountCode})` : ''}</span>
                    <span>-{formatCurrency(order.discountAmount, order.currencyCode)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shippingAmount, order.currencyCode)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatCurrency(order.taxAmount, order.currencyCode)}</span>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount, order.currencyCode)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          {(order.payments ?? []).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {order.payments!.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium capitalize">{p.provider}</p>
                        {p.transactionId && (
                          <p className="text-xs text-muted-foreground font-mono">{p.transactionId}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatCurrency(p.amount, p.currencyCode)}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              {order.customer ? (
                <div>
                  <p className="text-sm font-medium">
                    {order.customer.firstName} {order.customer.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                  {order.customer.phone && (
                    <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
                  )}
                  <Link
                    href={`/commerce/customers?id=${order.customerId}`}
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                  >
                    View customer →
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Guest checkout</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping address */}
          {addr && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-0.5">
                  <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                  {addr.company && <p className="text-muted-foreground">{addr.company}</p>}
                  <p>{addr.address1}</p>
                  {addr.address2 && <p>{addr.address2}</p>}
                  <p>{addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.zip}</p>
                  <p>{addr.countryCode}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Returns */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">No returns on this order.</p>
              {order.status === 'delivered' && (
                <Button size="sm" variant="outline" className="mt-3 w-full" asChild>
                  <Link href={`/commerce/returns?orderId=${order.id}`}>Create Return</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order #{order.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">This action cannot be undone. Please provide a reason.</p>
            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Customer requested, out of stock, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Back</Button>
            <Button
              variant="destructive"
              disabled={!cancelReason.trim() || cancelOrder.isPending}
              onClick={() =>
                cancelOrder.mutate({ orderId: order.id, reason: cancelReason }, {
                  onSuccess: () => { setCancelDialogOpen(false); setCancelReason(''); },
                })
              }
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
