'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { orderService } from '@/services/order-service';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { PATHS } from '@/lib/paths';

type Props = { onCreated: () => void };

export function InitiateProductionDialog({ onCreated }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    quantity: '100',
    unitPrice: '10',
    currency: 'USD',
    destinationCountry: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const isValid = form.productId.trim() && Number(form.quantity) > 0 && Number(form.unitPrice) > 0;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const order = await orderService.createOrder({
        lines: [{ product_id: form.productId.trim(), quantity: Number(form.quantity), unit_price: Number(form.unitPrice) }],
        currency: form.currency.toUpperCase(),
        destination_country: form.destinationCountry.trim().toUpperCase() || undefined,
      });
      toast({ title: 'Production Initiated', description: `Order ${order.id} is now in the pipeline.` });
      setOpen(false);
      setForm({ productId: '', quantity: '100', unitPrice: '10', currency: 'USD', destinationCountry: '' });
      onCreated();
      router.push(`${PATHS.ORDERS}/${order.id}`);
    } catch (err) {
      toast({
        title: 'Could not initiate production',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-black shadow-2xl h-14 px-6 text-[10px] uppercase tracking-widest bg-primary">
          <Plus className="mr-2 h-4 w-4" /> Initiate Production
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Initiate Production Order</DialogTitle>
          <DialogDescription>Provisions a new money-true order into the execution pipeline.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Product ID / SKU</Label>
            <Input value={form.productId} onChange={set('productId')} placeholder="SKU-BATTERY-4680" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity</Label>
              <Input type="number" value={form.quantity} onChange={set('quantity')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unit Price</Label>
              <Input type="number" value={form.unitPrice} onChange={set('unitPrice')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Currency</Label>
              <Input value={form.currency} onChange={set('currency')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Destination (ISO2)</Label>
              <Input value={form.destinationCountry} onChange={set('destinationCountry')} placeholder="US" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Initiate Production
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
