'use client';

import { useEffect, useState } from 'react';
import { Truck, Plus, Pencil, Trash2, ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useShippingZones,
  useCreateShippingZone,
  useAddShippingRate,
  useCouriers,
  useShipments,
} from '@/lib/queries/inventory.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';

export default function ShippingPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId } = useCommerceStore();
  const storeId = activeStoreId ?? '';

  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [zoneForm, setZoneForm] = useState({ name: '', countries: '' });
  const [rateForm, setRateForm] = useState({ name: '', price: '', minWeight: '', maxWeight: '', carrier: '' });

  const { data: zonesData, isLoading: loadingZones } = useShippingZones(storeId);
  const { data: couriers, isLoading: loadingCouriers } = useCouriers(storeId);
  const { data: shipmentsData, isLoading: loadingShipments } = useShipments(storeId, { limit: 10 });
  const createZone = useCreateShippingZone(storeId);
  const addRate = useAddShippingRate(storeId);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Shipping' }]);
  }, [setBreadcrumbs]);

  const zones = (zonesData?.data ?? []) as unknown as Array<{ id: string; name: string; countries?: string[]; rates?: Array<{ id: string; name: string; price: number; carrier?: string }> }>;
  const shipments = shipmentsData?.data ?? [];

  if (!storeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Truck className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground">Select a store from the Commerce overview.</p>
        <Button asChild variant="outline"><Link href="/commerce">Go to Overview</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipping"
        description="Manage shipping zones, rates, and shipments"
      />

      <Tabs defaultValue="zones">
        <TabsList>
          <TabsTrigger value="zones">Zones & Rates</TabsTrigger>
          <TabsTrigger value="couriers">Couriers</TabsTrigger>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
        </TabsList>

        {/* Zones */}
        <TabsContent value="zones" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setZoneDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Zone
            </Button>
          </div>

          {loadingZones ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : zones.length === 0 ? (
            <div className="py-12 text-center">
              <Truck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No shipping zones configured</p>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map((zone) => (
                <Card key={zone.id}>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <div>
                      <CardTitle className="text-sm">{zone.name}</CardTitle>
                      {zone.countries?.length ? (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {zone.countries.join(', ')}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setSelectedZoneId(zone.id); setRateDialogOpen(true); }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Rate
                    </Button>
                  </CardHeader>
                  {zone.rates?.length ? (
                    <CardContent className="p-0 border-t">
                      <div className="divide-y">
                        {zone.rates.map((rate) => (
                          <div key={rate.id} className="flex items-center justify-between px-4 py-2.5">
                            <div>
                              <p className="text-sm">{rate.name}</p>
                              {rate.carrier && <p className="text-xs text-muted-foreground">{rate.carrier}</p>}
                            </div>
                            <span className="text-sm font-medium">{rate.price}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="py-3 text-xs text-muted-foreground">No rates configured</CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Couriers */}
        <TabsContent value="couriers" className="mt-4">
          {loadingCouriers ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !couriers?.length ? (
            <div className="py-12 text-center">
              <Truck className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No couriers configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(couriers as Array<{ id: string; name: string; code?: string; isActive?: boolean }>).map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      {c.code && <p className="text-xs text-muted-foreground font-mono">{c.code}</p>}
                    </div>
                    {c.isActive != null && (
                      <Badge variant={c.isActive ? 'success' : 'secondary'} className="ml-auto text-xs">
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Shipments */}
        <TabsContent value="shipments" className="mt-4">
          {loadingShipments ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : shipments.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No shipments yet</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {(shipments as Array<{ id: string; trackingNumber?: string; status: string; createdAt: string }>).map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-mono">{s.trackingNumber ?? s.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(s.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">{s.status.replace('_', ' ')}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Zone dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Shipping Zone</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Zone Name *</Label>
              <Input
                value={zoneForm.name}
                onChange={(e) => setZoneForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Middle East"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Countries (comma-separated ISO codes)</Label>
              <Input
                value={zoneForm.countries}
                onChange={(e) => setZoneForm((f) => ({ ...f, countries: e.target.value }))}
                placeholder="AE, SA, KW, BH"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!zoneForm.name || createZone.isPending}
              onClick={() =>
                createZone.mutate(
                  { name: zoneForm.name, countries: zoneForm.countries.split(',').map((c) => c.trim()).filter(Boolean) },
                  { onSuccess: () => { setZoneDialogOpen(false); setZoneForm({ name: '', countries: '' }); } }
                )
              }
            >
              Create Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rate dialog */}
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Shipping Rate</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Rate Name *</Label>
                <Input
                  value={rateForm.name}
                  onChange={(e) => setRateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Standard Shipping"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price (cents) *</Label>
                <Input
                  type="number"
                  value={rateForm.price}
                  onChange={(e) => setRateForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="1500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Carrier</Label>
              <Input
                value={rateForm.carrier}
                onChange={(e) => setRateForm((f) => ({ ...f, carrier: e.target.value }))}
                placeholder="Aramex, FedEx, DHL..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!rateForm.name || !rateForm.price || addRate.isPending}
              onClick={() =>
                addRate.mutate(
                  { zoneId: selectedZoneId, payload: { name: rateForm.name, price: Number(rateForm.price), carrier: rateForm.carrier || undefined } },
                  { onSuccess: () => { setRateDialogOpen(false); setRateForm({ name: '', price: '', minWeight: '', maxWeight: '', carrier: '' }); } }
                )
              }
            >
              Add Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
