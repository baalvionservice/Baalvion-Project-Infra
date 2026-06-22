'use client';

/**
 * @file restricted-goods-screening.tsx
 * @description Live restricted-goods screening for a customs entry. Calls the Rule/Policy
 * Engine (`/api/compliance/goods-screening`) with the entry's HS code + jurisdictions and
 * renders the decision (ALLOW / REVIEW / DENY) plus any required licenses and certificates.
 * Degrades gracefully: if the baseline rule set is not provisioned the endpoint 404s and we
 * show an explicit "not provisioned" state rather than a hard error.
 */
import { useGoodsScreening, type GoodsDecision } from '@/api/goods-screening';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldAlert, ShieldX, FileCheck, KeyRound, Loader2, ScanLine, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  hsCode?: string | null;
  productCategory?: string | null;
  originCountry?: string | null;
  destinationCountry?: string | null;
  direction?: 'IMPORT' | 'EXPORT' | 'BOTH';
}

const DECISION_META: Record<GoodsDecision, { label: string; icon: typeof ShieldCheck; cls: string; tone: string }> = {
  ALLOW: { label: 'Cleared', icon: ShieldCheck, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', tone: 'text-emerald-600' },
  REVIEW: { label: 'Manual Review', icon: ShieldAlert, cls: 'bg-amber-50 text-amber-700 border-amber-200', tone: 'text-amber-600' },
  DENY: { label: 'Prohibited', icon: ShieldX, cls: 'bg-red-50 text-red-700 border-red-200', tone: 'text-red-600' },
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="shadow-none border-2 bg-background overflow-hidden rounded-2xl">
      <CardHeader className="bg-muted/10 border-b py-6 px-6">
        <CardTitle className="text-sm font-black uppercase tracking-wide flex items-center gap-3">
          <ScanLine className="h-5 w-5 text-primary opacity-30" />
          Restricted-Goods Screening
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
}

export function RestrictedGoodsScreening({ hsCode, productCategory, originCountry, destinationCountry, direction = 'IMPORT' }: Props) {
  const { data, isLoading, isError, error, refetch, isFetching } = useGoodsScreening({
    hsCode,
    productCategory,
    originCountry,
    destinationCountry,
    direction,
  });

  if (!hsCode?.trim() && !productCategory?.trim()) {
    return (
      <Shell>
        <p className="py-4 text-center text-xs italic text-muted-foreground">
          No HS classification on this entry — screening unavailable until the goods are classified.
        </p>
      </Shell>
    );
  }

  if (isLoading) {
    return (
      <Shell>
        <div className="flex items-center justify-center gap-3 py-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin opacity-40" />
          <span className="text-[10px] font-black uppercase tracking-widest">Evaluating policy engine…</span>
        </div>
      </Shell>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : 'Screening failed.';
    const notProvisioned = /not[_ ]?found|404/i.test(message);
    return (
      <Shell>
        <div className="space-y-4 py-2">
          <p className="text-xs font-medium text-muted-foreground">
            {notProvisioned
              ? 'The restricted-goods rule set is not provisioned in this environment yet.'
              : message}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 font-black uppercase text-[9px] tracking-widest border-2">
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </Shell>
    );
  }

  if (!data) return null;

  const meta = DECISION_META[data.decision];
  const Icon = meta.icon;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon className={cn('h-8 w-8', meta.tone)} />
            <div>
              <Badge variant="outline" className={cn('uppercase font-black text-[10px] px-3 py-1 border-2 rounded-full', meta.cls)}>
                {meta.label}
              </Badge>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                {direction} · {destinationCountry || '—'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-muted-foreground transition-colors hover:text-primary disabled:opacity-40"
            aria-label="Re-run screening"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
        </div>

        {data.reasons.length > 0 && (
          <ul className="space-y-2">
            {data.reasons.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-xs font-medium leading-relaxed">
                <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', data.decision === 'DENY' ? 'bg-red-500' : 'bg-amber-500')} />
                {reason}
              </li>
            ))}
          </ul>
        )}

        {(data.requiredLicenses.length > 0 || data.requiredCertificates.length > 0) && (
          <div className="grid gap-5 sm:grid-cols-2">
            {data.requiredLicenses.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600">
                  <KeyRound className="h-3 w-3" /> Required Licenses
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.requiredLicenses.map((lic) => (
                    <Badge key={lic} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-bold">{lic}</Badge>
                  ))}
                </div>
              </div>
            )}
            {data.requiredCertificates.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  <FileCheck className="h-3 w-3" /> Required Certificates
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.requiredCertificates.map((cert) => (
                    <Badge key={cert} variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-bold">{cert}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {data.decision === 'ALLOW' && data.requiredLicenses.length === 0 && data.requiredCertificates.length === 0 && (
          <p className="text-xs italic text-muted-foreground">No restrictions or documentary obligations matched for this classification.</p>
        )}

        <p className="border-t pt-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
          Policy engine · {data.matchedRules.length} rule{data.matchedRules.length === 1 ? '' : 's'} matched
        </p>
      </div>
    </Shell>
  );
}
