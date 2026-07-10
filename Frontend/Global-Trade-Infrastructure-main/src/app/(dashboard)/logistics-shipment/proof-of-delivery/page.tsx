/**
 * @file logistics-shipment/proof-of-delivery/page.tsx
 * @description Proof of Delivery — capture receiver/signature/photo evidence for a shipment and
 * browse past delivery captures.
 */
'use client';

import { useState } from 'react';
import { Loader2, PackageCheck, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useProofOfDelivery, useCapturePod } from '@/api/tracking-platform';

export default function ProofOfDeliveryPage() {
  const { data, isLoading } = useProofOfDelivery();
  const capturePod = useCapturePod();
  const [form, setForm] = useState({ shipmentId: '', receiverName: '', otpCode: '', notes: '' });

  const handleCapture = () => {
    if (!form.shipmentId) return;
    capturePod.mutate(
      { shipmentId: form.shipmentId, receiverName: form.receiverName, otpCode: form.otpCode || undefined, notes: form.notes },
      { onSuccess: () => setForm({ shipmentId: '', receiverName: '', otpCode: '', notes: '' }) },
    );
  };

  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Shipment Tracking Platform</p>
        <h2 className="text-4xl font-black tracking-tighter uppercase">Proof of Delivery.</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6"><CardTitle className="text-lg font-black uppercase tracking-tighter">Delivery Captures</CardTitle></CardHeader>
            <CardContent className="p-0 divide-y">
              {isLoading && <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
              {!isLoading && (data?.items || []).length === 0 && <p className="p-12 text-center text-xs font-bold uppercase text-muted-foreground">No deliveries captured yet</p>}
              {(data?.items || []).map((pod) => (
                <div key={pod.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 border-2 flex items-center justify-center"><PackageCheck className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                      <p className="font-black uppercase tracking-tight text-sm flex items-center gap-2"><User className="h-3 w-3" /> {pod.receiverName || 'Unknown receiver'}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{new Date(pod.deliveredAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {pod.otpVerified && <Badge className="bg-emerald-600 text-white text-[8px] font-black">OTP Verified</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="shadow-none border-2 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wide">Capture Delivery</h3>
            <Input placeholder="Shipment ID (UUID)" value={form.shipmentId} onChange={(e) => setForm({ ...form, shipmentId: e.target.value })} />
            <Input placeholder="Receiver name" value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} />
            <Input placeholder="OTP code (if required)" value={form.otpCode} onChange={(e) => setForm({ ...form, otpCode: e.target.value })} />
            <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button className="w-full font-black uppercase text-xs" disabled={capturePod.isPending} onClick={handleCapture}>
              <PackageCheck className="h-4 w-4 mr-2" /> Capture Proof of Delivery
            </Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
