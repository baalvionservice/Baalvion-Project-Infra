'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { contractService } from '@/services/contract-service';
import { useToast } from '@/hooks/use-toast';

type Props = { onCreated: () => void };

export function NewMsaNodeDialog({ onCreated }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    buyerId: '',
    sellerId: '',
    value: '',
    currency: 'USD',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const isValid = form.title.trim() && form.buyerId.trim() && form.sellerId.trim() && Number(form.value) > 0;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await contractService.archiveMandate({
        title: form.title.trim(),
        buyerId: form.buyerId.trim(),
        sellerId: form.sellerId.trim(),
        parties: `${form.buyerId.trim()} ↔ ${form.sellerId.trim()}`,
        value: Number(form.value),
        currency: form.currency.toUpperCase(),
      });
      toast({ title: 'MSA Node Created', description: `${form.title} has been vaulted.` });
      setOpen(false);
      setForm({ title: '', buyerId: '', sellerId: '', value: '', currency: 'USD' });
      onCreated();
    } catch (err) {
      toast({
        title: 'Could not create MSA node',
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
          <Plus className="mr-2 h-4 w-4" /> NEW MSA Node
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Master Service Agreement Node</DialogTitle>
          <DialogDescription>Vaults a new commercial mandate into the Contract Vault registry.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <Field label="Agreement Title">
            <Input value={form.title} onChange={set('title')} placeholder="Master Supply Agreement: ..." />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Buyer Entity ID"><Input value={form.buyerId} onChange={set('buyerId')} placeholder="COMP-101" /></Field>
            <Field label="Seller Entity ID"><Input value={form.sellerId} onChange={set('sellerId')} placeholder="COMP-102" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Agreement Value"><Input type="number" value={form.value} onChange={set('value')} placeholder="1250000" /></Field>
            <Field label="Currency"><Input value={form.currency} onChange={set('currency')} placeholder="USD" /></Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create MSA Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
