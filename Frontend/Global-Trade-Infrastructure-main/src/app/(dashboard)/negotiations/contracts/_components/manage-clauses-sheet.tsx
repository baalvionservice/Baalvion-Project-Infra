'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileStack, Loader2, ShieldAlert } from 'lucide-react';
import { contractService, ClauseReference } from '@/services/contract-service';
import { cn } from '@/lib/utils';

const RISK_STYLES: Record<ClauseReference['riskLevel'], string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-red-50 text-red-700 border-red-200',
};

export function ManageClausesSheet() {
  const [loading, setLoading] = useState(false);
  const [clauses, setClauses] = useState<ClauseReference[]>([]);
  const [loaded, setLoaded] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    if (!open || loaded) return;
    setLoading(true);
    try {
      const data = await contractService.getClauses();
      setClauses(data);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="font-black border-2 bg-background h-14 px-8 text-[10px] uppercase tracking-widest shadow-md">
          <FileStack className="mr-2 h-4 w-4" /> MANAGE CLAUSES
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="uppercase tracking-tight">Clause Library</SheetTitle>
          <SheetDescription>Standard and negotiated clauses available to attach to contract nodes.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary opacity-40" />
            </div>
          ) : clauses.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-12 text-center">No clauses in the library yet.</p>
          ) : (
            clauses.map((clause) => (
              <div key={clause.id} className="p-4 rounded-xl border-2 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="outline" className="text-[9px] font-black uppercase h-6 px-3 border-2 rounded-full">
                    {clause.category}
                  </Badge>
                  <Badge variant="outline" className={cn('text-[9px] font-black uppercase h-6 px-3 border-2 rounded-full flex items-center gap-1', RISK_STYLES[clause.riskLevel])}>
                    {clause.riskLevel === 'HIGH' && <ShieldAlert className="h-3 w-3" />}
                    {clause.riskLevel} RISK
                  </Badge>
                </div>
                <p className="text-sm font-medium leading-relaxed">{clause.content}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                  {clause.isStandard ? 'Standard Clause' : 'Negotiated Clause'} · ID: {clause.id}
                </p>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
