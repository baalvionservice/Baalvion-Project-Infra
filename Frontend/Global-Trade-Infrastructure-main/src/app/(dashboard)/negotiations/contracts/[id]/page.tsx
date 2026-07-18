'use client';

/**
 * @file negotiations/contracts/[id]/page.tsx
 * @description Single-contract detail view: agreement metadata, legal-risk analysis
 * and attached clauses. Reached from the Contract Vault card / eye action.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contractService, Contract } from '@/services/contract-service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2, FileSignature, ShieldCheck, ShieldAlert, Landmark } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { PATHS } from '@/lib/paths';

const RISK_STYLES: Record<string, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
};

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await contractService.getById(params.id);
      if (!cancelled) {
        setContract(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Resolving Contract Node...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Contract Not Found</h2>
        <p className="text-muted-foreground font-medium italic">This agreement could not be resolved in the vault.</p>
        <Button onClick={() => router.push(PATHS.CONTRACT_WORKSPACE)} className="h-14 px-6 font-black uppercase tracking-widest shadow-xl">
          Return to Vault
        </Button>
      </div>
    );
  }

  return (
    <main className="flex-1 space-y-6 p-4 md:p-6 bg-muted/20 min-h-screen pb-32">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl border-2" onClick={() => router.push(PATHS.CONTRACT_WORKSPACE)}>
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Contract Node</p>
          <h2 className="text-3xl font-black tracking-tighter uppercase text-foreground leading-none">{contract.title}</h2>
        </div>
        <Badge variant="outline" className={cn(
          'text-[9px] font-black uppercase h-7 px-3 border-2 rounded-full ml-2',
          contract.status === 'EXECUTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200',
        )}>
          {contract.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-none border-2 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" /> Agreement Details
            </CardTitle>
            <CardDescription>ID: {contract.id} · Version {contract.version}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Signatories" value={contract.parties} />
            <Row label="Buyer" value={contract.buyerId} />
            <Row label="Seller" value={contract.sellerId} />
            <Row label="Agreement Value" value={formatCurrency(contract.value, contract.currency)} />
            {contract.effectiveDate && <Row label="Effective" value={format(new Date(contract.effectiveDate), 'MMM d, yyyy')} />}
            {contract.expiryDate && <Row label="Expiry" value={format(new Date(contract.expiryDate), 'MMM d, yyyy')} />}
            <Row label="Last Updated" value={format(new Date(contract.updatedAt), 'MMM d, yyyy p')} />
          </CardContent>
        </Card>

        <Card className="shadow-none border-2 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Clauses
            </CardTitle>
            <CardDescription>{contract.clauses.length} attached</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {contract.clauses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No clauses attached to this node.</p>
            ) : (
              contract.clauses.map((clause) => (
                <div key={clause.id} className="p-3 rounded-xl border-2 bg-muted/10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[9px] font-black uppercase h-5 px-2 border-2 rounded-full">{clause.category}</Badge>
                    <Badge variant="outline" className={cn('text-[9px] font-black uppercase h-5 px-2 border-2 rounded-full flex items-center gap-1', RISK_STYLES[clause.riskLevel])}>
                      {clause.riskLevel === 'HIGH' && <ShieldAlert className="h-3 w-3" />}
                      {clause.riskLevel}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{clause.content}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="p-6 rounded-2xl bg-primary text-primary-foreground relative overflow-hidden shadow-md">
        <div className="relative z-10 flex items-center gap-4">
          <Landmark className="h-8 w-8 opacity-60" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Legal Finality Node</p>
            <p className="text-lg font-black uppercase tracking-tight">Cryptographically signed · Version-locked · Audit-ready</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{label}</span>
      <span className="text-sm font-bold text-right">{value}</span>
    </div>
  );
}
