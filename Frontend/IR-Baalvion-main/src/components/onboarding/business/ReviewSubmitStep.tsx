'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import {
  ENTITY_TYPES, DOCUMENT_TYPES, labelFor,
  type BusinessOnboardingData,
} from './options';
import type { SubmissionResult } from './BusinessOnboardingFunnel';

const SECTION_CLS = 'text-[11px] font-bold uppercase tracking-widest text-primary';

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border/30 last:border-0">
      <span className="text-[11px] uppercase font-bold tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm text-right text-foreground break-words max-w-[60%]">{value}</span>
    </div>
  );
}

interface Props {
  data: BusinessOnboardingData;
  onBack: () => void;
  onSubmitted: (result: SubmissionResult) => void;
}

export function ReviewSubmitStep({ data, onBack, onSubmitted }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const taxIds = [
    data.iecCode && `IEC ${data.iecCode}`,
    data.gstin && `GSTIN ${data.gstin}`,
    data.vatNumber && `VAT ${data.vatNumber}`,
    data.pan && `PAN ${data.pan}`,
  ].filter(Boolean) as string[];

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/ir/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        onSubmitted({
          reference: json.reference,
          status: json.status,
          kycStatus: json.kycStatus,
          documentsCount: json.documentsCount,
        });
      } else {
        setError(json?.error || 'Submission failed. Please review your details and try again.');
        setSubmitting(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div suppressHydrationWarning>
      <CardHeader className="text-center border-b border-border/50 pb-8">
        <CardTitle className="text-2xl font-bold tracking-tight">Review &amp; Submit</CardTitle>
        <CardDescription>Confirm your details before submitting for verification.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <section className="space-y-1">
          <p className={SECTION_CLS}>Company</p>
          <Row label="Legal Name" value={data.legalName} />
          <Row label="Trade Name" value={data.tradeName} />
          <Row label="Entity Type" value={labelFor(ENTITY_TYPES, data.entityType)} />
          <Row label="Incorporation" value={[data.incorporationCountry, data.incorporationDate].filter(Boolean).join(' · ')} />
          <Row label="Registration No." value={data.registrationNumber} />
        </section>

        <Separator className="bg-border/50" />
        <section className="space-y-1">
          <p className={SECTION_CLS}>Contact</p>
          <Row label="Name" value={data.contactName} />
          <Row label="Email" value={data.contactEmail} />
          <Row label="Phone" value={data.contactPhone} />
          <Row label="Website" value={data.website} />
        </section>

        <Separator className="bg-border/50" />
        <section className="space-y-2">
          <p className={SECTION_CLS}>Trade &amp; Tax</p>
          <div className="flex flex-wrap gap-2">
            {taxIds.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
            {taxIds.map((t) => (
              <Badge key={t} variant="secondary" className="font-mono text-xs">{t}</Badge>
            ))}
          </div>
        </section>

        <Separator className="bg-border/50" />
        <section className="space-y-1">
          <p className={SECTION_CLS}>KYC</p>
          <Row label="Signatory" value={data.authorizedSignatoryName} />
          <Row label="Signatory Email" value={data.authorizedSignatoryEmail} />
          <Row label="Beneficial Owners" value={data.beneficialOwners.length ? String(data.beneficialOwners.length) : undefined} />
        </section>

        <Separator className="bg-border/50" />
        <section className="space-y-2">
          <p className={SECTION_CLS}>Documents ({data.documents.length})</p>
          <div className="space-y-1">
            {data.documents.length === 0 && <span className="text-sm text-muted-foreground">No documents attached.</span>}
            {data.documents.map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{labelFor(DOCUMENT_TYPES, d.documentType)}</span>
                <span className="text-foreground break-words max-w-[55%] text-right">{d.title}</span>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span>By submitting you confirm the information is accurate. Your application enters compliance review.</span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="h-12 font-bold uppercase tracking-widest" onClick={onBack} disabled={submitting}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button type="button" className="flex-1 h-12 font-bold uppercase tracking-widest" onClick={submit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
