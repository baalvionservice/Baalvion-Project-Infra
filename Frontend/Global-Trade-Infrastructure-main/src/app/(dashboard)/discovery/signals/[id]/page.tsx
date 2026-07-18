'use client';

/**
 * @file discovery/signals/[id]/page.tsx
 * @description Detail view for a single market/trade signal — real data from
 * trade-service's `trade_signals` collection (see `signal-intelligence.ts`).
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ShieldAlert, Globe, History, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sigIntService } from '@/services/intelligence/signal-intelligence';
import type { TradeSignal } from '@/types/institutional';

export default function SignalDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    sigIntService
      .getSignal(id)
      .then((s) => {
        if (!s) setError('Signal not found.');
        setSignal(s);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-sm font-bold text-muted-foreground">{error ?? 'Signal not found.'}</p>
        <Button variant="outline" onClick={() => router.push('/discovery/signals')}>Back to Signals</Button>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-8 p-4 md:p-6 bg-muted/20 min-h-screen max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => router.push('/discovery/signals')} className="-ml-4 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
        <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to Signals
      </Button>

      <Card className="border-2 rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b py-8 px-8">
          <div className="flex items-center gap-4">
            <div className={cn('h-16 w-24 rounded-2xl border-2 flex items-center justify-center shadow-inner shrink-0',
              signal.severity === 'critical' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200')}>
              <ShieldAlert className={cn('h-9 w-9', signal.severity === 'critical' ? 'text-red-600' : 'text-orange-600')} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Badge className="text-[10px] font-black uppercase h-6 px-3 border-none bg-slate-900 text-white tracking-widest">{signal.type}</Badge>
                <Badge variant="outline" className="uppercase font-black text-[9px]">{signal.severity}</Badge>
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tight">Signal {signal.id.slice(0, 8)}</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <p className="text-lg font-medium leading-relaxed italic opacity-90 border-l-4 border-red-500/10 pl-6">"{signal.message}"</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {signal.commodity && (
              <div className="p-5 rounded-2xl border-2 bg-muted/5">
                <div className="flex items-center gap-2 mb-2 opacity-60"><Globe className="h-4 w-4" /><span className="text-[9px] font-black uppercase tracking-widest">Commodity</span></div>
                <p className="text-sm font-black">{signal.commodity}</p>
              </div>
            )}
            {signal.source && (
              <div className="p-5 rounded-2xl border-2 bg-muted/5">
                <div className="flex items-center gap-2 mb-2 opacity-60"><span className="text-[9px] font-black uppercase tracking-widest">Source</span></div>
                <p className="text-sm font-black">{signal.source}</p>
              </div>
            )}
            <div className="p-5 rounded-2xl border-2 bg-muted/5">
              <div className="flex items-center gap-2 mb-2 opacity-60"><History className="h-4 w-4" /><span className="text-[9px] font-black uppercase tracking-widest">Detected</span></div>
              <p className="text-sm font-black">{signal.createdAt ? format(new Date(signal.createdAt), 'PPpp') : '—'}</p>
            </div>
            <div className="p-5 rounded-2xl border-2 bg-muted/5">
              <div className="flex items-center gap-2 mb-2 opacity-60"><span className="text-[9px] font-black uppercase tracking-widest">Reference</span></div>
              <p className="text-sm font-mono">{signal.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
