'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCarriers, useCreateCarrier, CreateCarrierBody, TransportMode } from '@/api';
import { FreightNavTabs } from '../../_components/freight-nav-tabs';
import { CARRIER_STATUS_COLORS } from '../../_components/mode-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_MODES: TransportMode[] = ['ocean', 'air', 'rail', 'road', 'express', 'multimodal'];

export default function CarrierManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, isLoading } = useCarriers({});
  const carriers = data?.items ?? [];
  const createCarrier = useCreateCarrier();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', country: '', connectorKey: 'none' as string, mode: 'road' as TransportMode });

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast({ variant: 'destructive', title: 'Code and name are required' });
      return;
    }
    const body: CreateCarrierBody = {
      code: form.code.trim().toLowerCase(),
      name: form.name.trim(),
      country: form.country || undefined,
      connectorKey: form.connectorKey === 'none' ? undefined : (form.connectorKey as CreateCarrierBody['connectorKey']),
      modes: [form.mode],
      status: 'active',
      availabilityStatus: 'active',
    };
    try {
      const carrier = await createCarrier.mutateAsync(body);
      toast({ title: 'Carrier registered', description: `${carrier.name} added to the directory.` });
      setOpen(false);
      setForm({ code: '', name: '', country: '', connectorKey: 'none', mode: 'road' });
      router.push(`/logistics-shipment/freight/carriers/manage/${carrier.id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to register carrier', description: e instanceof Error ? e.message : 'Unexpected error.' });
    }
  };

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carrier Management</h1>
          <p className="text-sm text-muted-foreground">Register any carrier dynamically — no code required for a new provider to be quoted and compared.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Carrier</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Register a Carrier</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2"><Label>Carrier Code *</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="msc" /></div>
              <div className="space-y-2"><Label>Carrier Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Mediterranean Shipping Company" /></div>
              <div className="space-y-2"><Label>Country</Label><Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="CH" /></div>
              <div className="space-y-2">
                <Label>Primary Mode</Label>
                <Select value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v as TransportMode }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ALL_MODES.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Live API Connector</Label>
                <Select value={form.connectorKey} onValueChange={(v) => setForm((f) => ({ ...f, connectorKey: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None — manual / simulated pricing</SelectItem>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="maersk">Maersk</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">Leave as manual to onboard a carrier with no coded integration — it is still fully quotable via the generic connector.</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={createCarrier.isPending}>
                {createCarrier.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Register Carrier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <FreightNavTabs />

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="text-sm text-muted-foreground py-10 text-center">Loading carriers…</p>}
          {!isLoading && carriers.length === 0 && <p className="text-sm text-muted-foreground py-10 text-center">No carriers registered yet.</p>}
          {!isLoading && carriers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Connector</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Reliability</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carriers.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/logistics-shipment/freight/carriers/manage/${c.id}`)}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.code}</TableCell>
                    <TableCell>{c.connectorKey ? <Badge variant="verified" className="text-[8px]">{c.connectorKey}</Badge> : <Badge variant="outline" className="text-[8px]">manual</Badge>}</TableCell>
                    <TableCell>{c.rating != null ? c.rating.toFixed(1) : '—'}</TableCell>
                    <TableCell>{c.reliabilityScore}%</TableCell>
                    <TableCell>{c.performanceScore != null ? c.performanceScore.toFixed(0) : '—'}</TableCell>
                    <TableCell><Badge variant="outline" className={cn('text-[9px] capitalize', CARRIER_STATUS_COLORS[c.status])}>{c.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
