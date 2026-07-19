'use client';

import { useCallback, useEffect, useState } from 'react';
import { getWallet, getTransactions, depositFunds, Wallet, Transaction } from '@/services/payment-service';
import { BalanceCards } from './_components/balance-cards';
import { TransactionTable } from './_components/transaction-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, Download, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PaymentsDashboardPage() {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [w, t] = await Promise.all([
      getWallet().catch(() => undefined),
      getTransactions().catch(() => []),
    ]);
    setWallet(w ?? null);
    setTransactions(t);
  }, []);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  function exportStatement() {
    if (transactions.length === 0) {
      toast({ variant: 'destructive', title: 'Nothing to export', description: 'No transactions loaded yet.' });
      return;
    }
    const header = 'id,type,status,amount,currency,description,orderId,createdAt\n';
    const rows = transactions
      .map((t) => [t.id, t.type, t.status, t.amount, t.currency, `"${(t.description || '').replace(/"/g, '""')}"`, t.orderId || '', t.createdAt].join(','))
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `account-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: 'Statement exported', description: `${transactions.length} transactions downloaded as CSV.` });
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-8 p-4 md:p-8 bg-muted/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Hub</h2>
          <p className="text-muted-foreground">Manage institutional liquidity and trade settlements.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={exportStatement}>
              <Download className="mr-2 h-4 w-4" /> Export Statement
           </Button>
           <DepositFundsDialog defaultCurrency={wallet?.currency} onDeposited={loadAll} />
        </div>
      </div>

      <BalanceCards wallet={wallet} />

      <div className="grid gap-6">
        <Card className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription>Latest financial activity across your account.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
               <Link href="/payments/transactions">
                 View All <ArrowRight className="ml-2 h-4 w-4" />
               </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <TransactionTable data={transactions} limit={5} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function DepositFundsDialog({ defaultCurrency, onDeposited }: { defaultCurrency?: string; onDeposited: () => Promise<void> }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currency, setCurrency] = useState(defaultCurrency || 'USD');
  const [amount, setAmount] = useState('');

  const valid = currency.trim().length === 3 && Number(amount) > 0;

  async function submit() {
    setSubmitting(true);
    try {
      await depositFunds(currency.trim().toUpperCase(), Number(amount));
      toast({ title: 'Funds deposited', description: `${currency.toUpperCase()} ${amount} credited to your wallet.` });
      setOpen(false);
      setAmount('');
      await onDeposited();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Deposit failed', description: e instanceof Error ? e.message : 'Could not credit the wallet.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
           <Plus className="mr-2 h-4 w-4" /> Deposit Funds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Deposit Funds</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} placeholder="USD" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Amount</Label>
            <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting || !valid}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Deposit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
