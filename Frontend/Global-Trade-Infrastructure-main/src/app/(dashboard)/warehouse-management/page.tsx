/**
 * @file warehouse-management/page.tsx
 * @description Warehouse Map — location hierarchy overview (zones + bins) for a selected warehouse.
 * Real data via useWarehouses/useZones/useBins (src/api/warehouse.ts), wired to trade-service.
 */
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Boxes, PackageCheck, ClipboardCheck, Plus, Loader2, Warehouse as WarehouseIcon,
  Thermometer, ShieldAlert, QrCode,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/status-badge';
import { useToast } from '@/hooks/use-toast';
import { PATHS } from '@/lib/paths';
import { errorMessage } from '@/api/client';
import {
  useWarehouses, useZones, useBins, useCreateZone, useCreateBin,
  type ZoneType, type BinType,
} from '@/api/warehouse';

const ZONE_TYPES: ZoneType[] = ['storage', 'receiving', 'staging', 'packing', 'hazmat', 'cold_storage', 'quarantine', 'cross_dock'];
const BIN_TYPES: BinType[] = ['aisle', 'rack', 'shelf', 'bin'];

function utilizationPct(used: number, capacity: number | null): number {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(100, Math.round((used / capacity) * 100));
}

function CreateZoneDialog({ warehouseId }: { warehouseId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [zoneType, setZoneType] = useState<ZoneType>('storage');
  const createZone = useCreateZone();

  const handleSubmit = () => {
    createZone.mutate(
      { warehouseId, name, zoneType },
      {
        onSuccess: () => {
          toast({ title: 'Zone created', description: `"${name}" is ready for bins.` });
          setOpen(false);
          setName('');
        },
        onError: (err) => toast({ title: 'Could not create zone', description: errorMessage(err), variant: 'destructive' }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="font-bold uppercase text-xs tracking-wide">
          <Plus className="mr-2 h-4 w-4" /> New Zone
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Warehouse Zone</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="zone-name">Zone name</Label>
            <Input id="zone-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bulk Storage — East Wing" />
          </div>
          <div className="space-y-2">
            <Label>Zone type</Label>
            <Select value={zoneType} onValueChange={(v) => setZoneType(v as ZoneType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ZONE_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!name || createZone.isPending}>
            {createZone.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Zone'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateBinDialog({ warehouseId, zoneId }: { warehouseId: string; zoneId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [binType, setBinType] = useState<BinType>('bin');
  const [capacityUnits, setCapacityUnits] = useState('100');
  const createBin = useCreateBin();

  const handleSubmit = () => {
    createBin.mutate(
      { warehouseId, zoneId, binType, capacityUnits: capacityUnits ? Number(capacityUnits) : undefined },
      {
        onSuccess: () => {
          toast({ title: 'Bin created', description: 'A barcode/QR label was generated automatically.' });
          setOpen(false);
        },
        onError: (err) => toast({ title: 'Could not create bin', description: errorMessage(err), variant: 'destructive' }),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="font-bold uppercase text-[10px] tracking-wide">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Bin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Storage Location</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Location type</Label>
            <Select value={binType} onValueChange={(v) => setBinType(v as BinType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BIN_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bin-capacity">Capacity (units)</Label>
            <Input id="bin-capacity" type="number" value={capacityUnits} onChange={(e) => setCapacityUnits(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createBin.isPending}>
            {createBin.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Bin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function WarehouseManagementPage() {
  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses({ limit: 100 });
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const activeWarehouseId = warehouseId || warehouses?.items[0]?.id || '';

  const { data: zones, isLoading: loadingZones } = useZones(
    { warehouseId: activeWarehouseId, limit: 100 },
    { enabled: !!activeWarehouseId },
  );
  const { data: bins, isLoading: loadingBins } = useBins(
    { warehouseId: activeWarehouseId, zoneId: selectedZoneId ?? undefined, limit: 100 },
    { enabled: !!activeWarehouseId },
  );

  const activeWarehouse = useMemo(
    () => warehouses?.items.find((w) => w.id === activeWarehouseId),
    [warehouses, activeWarehouseId],
  );

  return (
    <main className="space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Warehouse Management System — Phase A</p>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Warehouse Map</h2>
          <p className="text-sm text-muted-foreground font-medium">Zones, aisles, racks, shelves, and bins for the selected facility.</p>
        </div>
        <div className="flex items-center gap-3">
          {loadingWarehouses ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Select value={activeWarehouseId} onValueChange={(v) => { setWarehouseId(v); setSelectedZoneId(null); }}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Select a warehouse" /></SelectTrigger>
              <SelectContent>
                {(warehouses?.items ?? []).map((w) => (
                  <SelectItem key={w.id} value={w.id}>{w.name}{w.code ? ` (${w.code})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Link href={PATHS.WAREHOUSE_RECEIVING}>
            <Button variant="outline" className="font-bold uppercase text-xs"><PackageCheck className="mr-2 h-4 w-4" /> Receiving</Button>
          </Link>
          <Link href={PATHS.WAREHOUSE_PUTAWAY}>
            <Button className="font-bold uppercase text-xs"><ClipboardCheck className="mr-2 h-4 w-4" /> Putaway Queue</Button>
          </Link>
        </div>
      </div>

      {!activeWarehouseId && !loadingWarehouses && (
        <Card className="border-2 border-dashed rounded-2xl">
          <CardContent className="py-16 text-center text-muted-foreground">
            <WarehouseIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
            No warehouses found. Create one via the Warehouses API before configuring zones and bins.
          </CardContent>
        </Card>
      )}

      {activeWarehouseId && (
        <>
          {activeWarehouse && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="rounded-2xl border-2">
                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Warehouse Utilization</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl font-black tabular-nums">{utilizationPct(activeWarehouse.usedUnits, activeWarehouse.capacityUnits)}%</div>
                  <Progress value={utilizationPct(activeWarehouse.usedUnits, activeWarehouse.capacityUnits)} className="mt-3 h-2" />
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-2">
                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Zones</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-black tabular-nums">{zones?.total ?? 0}</div></CardContent>
              </Card>
              <Card className="rounded-2xl border-2">
                <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Bins</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-black tabular-nums">{bins?.total ?? 0}</div></CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wide">Zones</h3>
                <CreateZoneDialog warehouseId={activeWarehouseId} />
              </div>
              {loadingZones ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedZoneId(null)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${selectedZoneId === null ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
                  >
                    <span className="text-xs font-black uppercase tracking-wide">All Bins</span>
                  </button>
                  {(zones?.items ?? []).map((zone) => (
                    <button
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${selectedZoneId === zone.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">{zone.name}</span>
                        <StatusBadge status={zone.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        <Boxes className="h-3 w-3" /> {zone.zoneType.replace(/_/g, ' ')}
                        {zone.temperatureZone && <><Thermometer className="h-3 w-3 ml-2" /> {zone.temperatureZone}</>}
                        {zone.hazardClass && <><ShieldAlert className="h-3 w-3 ml-2 text-orange-500" /> {zone.hazardClass}</>}
                      </div>
                    </button>
                  ))}
                  {zones?.items.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-2">No zones yet — create the first one above.</p>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wide">
                  Bins {selectedZoneId ? '— filtered by zone' : '(all zones)'}
                </h3>
                {selectedZoneId && <CreateBinDialog warehouseId={activeWarehouseId} zoneId={selectedZoneId} />}
              </div>
              {loadingBins ? (
                <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {(bins?.items ?? []).map((bin) => (
                    <Link key={bin.id} href={`${PATHS.WAREHOUSE_MANAGEMENT}/bins/${bin.id}`}>
                      <Card className="rounded-2xl border-2 hover:border-primary/40 transition-colors h-full">
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[9px] font-black uppercase">{bin.binType}</Badge>
                            <QrCode className="h-4 w-4 text-muted-foreground opacity-40" />
                          </div>
                          <p className="font-mono text-xs font-bold text-primary truncate">{bin.barcode}</p>
                          {bin.capacityUnits != null && (
                            <>
                              <Progress value={utilizationPct(bin.usedUnits, bin.capacityUnits)} className="h-1.5" />
                              <p className="text-[10px] text-muted-foreground font-bold">{bin.usedUnits} / {bin.capacityUnits} units</p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {bins?.items.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-2 col-span-full">
                      {selectedZoneId ? 'No bins in this zone yet.' : 'No bins yet.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
