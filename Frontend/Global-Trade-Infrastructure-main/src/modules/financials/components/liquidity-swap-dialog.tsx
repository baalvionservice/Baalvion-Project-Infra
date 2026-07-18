/**
 * @file liquidity-swap-dialog.tsx
 * @description Shared "corridor swap / liquidity swap" workflow — posts a real TRANSFER
 * journal entry between two currency nodes via treasuryService.rebalanceLiquidity.
 * Used by both the Settlement command and Treasury command surfaces.
 */
'use client';

import { useState } from 'react';
import { treasuryService } from '@/modules/financials/services/treasury.service';
import { WalletNode } from '@/modules/financials/types/financial.types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function LiquiditySwapDialog({
  wallets,
  onExecuted,
  trigger,
  title = 'Execute Liquidity Swap',
}: {
  wallets: WalletNode[];
  onExecuted: () => Promise<void>;
  trigger: React.ReactNode;
  title?: string;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');

  const sourceWallet = wallets.find((w) => w.id === sourceId);
  const valid = sourceId && targetId && sourceId !== targetId && Number(amount) > 0;

  async function submit() {
    setSubmitting(true);
    try {
      await treasuryService.rebalanceLiquidity(sourceId, targetId, Number(amount), sourceWallet?.currency || 'USD');
      toast({ title: 'Liquidity swap executed', description: 'Rebalancing entry posted to the settlement ledger.' });
      setOpen(false);
      setSourceId(''); setTargetId(''); setAmount('');
      await onExecuted();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Swap failed', description: e instanceof Error ? e.message : 'Could not post the rebalancing entry.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Source Node</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Select source currency node" /></SelectTrigger>
              <SelectContent>
                {wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.currency} — {formatCurrency(w.availableLiquidity, w.currency)} available</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Target Node</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger><SelectValue placeholder="Select target currency node" /></SelectTrigger>
              <SelectContent>
                {wallets.filter((w) => w.id !== sourceId).map((w) => <SelectItem key={w.id} value={w.id}>{w.currency}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount ({sourceWallet?.currency || '—'})</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !valid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Execute Swap
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProvisionCapitalDialog({
  wallets,
  onExecuted,
  trigger,
}: {
  wallets: WalletNode[];
  onExecuted: () => Promise<void>;
  trigger: React.ReactNode;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const targetWallet = wallets.find((w) => w.id === targetId);
  const valid = targetId && Number(amount) > 0;

  async function submit() {
    setSubmitting(true);
    try {
      await treasuryService.provisionCapital(targetId, Number(amount), targetWallet?.currency || 'USD', note.trim() || undefined);
      toast({ title: 'Capital provisioned', description: 'Deposit entry posted to the settlement ledger.' });
      setOpen(false);
      setTargetId(''); setAmount(''); setNote('');
      await onExecuted();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Provisioning failed', description: e instanceof Error ? e.message : 'Could not post the deposit entry.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Provision Capital</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Target Node</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger><SelectValue placeholder="Select currency node" /></SelectTrigger>
              <SelectContent>
                {wallets.map((w) => <SelectItem key={w.id} value={w.id}>{w.currency} Node</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount ({targetWallet?.currency || '—'})</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100000" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for this capital injection" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !valid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Provision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
