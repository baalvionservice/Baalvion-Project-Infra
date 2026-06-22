'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { TextField } from './BusinessField';
import type { BusinessOnboardingData } from './options';

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IEC_RE = /^[0-9A-Z]{10}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

interface Props {
  initial: BusinessOnboardingData;
  onNext: (patch: Partial<BusinessOnboardingData>) => void;
  onBack: (patch: Partial<BusinessOnboardingData>) => void;
}

export function TaxRegistrationStep({ initial, onNext, onBack }: Props) {
  const [iecCode, setIec] = useState(initial.iecCode);
  const [gstin, setGstin] = useState(initial.gstin);
  const [vatNumber, setVat] = useState(initial.vatNumber);
  const [pan, setPan] = useState(initial.pan);
  const [errors, setErrors] = useState<{ root?: string; iecCode?: string; gstin?: string; pan?: string }>({});

  const upper = (setter: (v: string) => void) => (v: string) => setter(v.toUpperCase());

  const patch = (): Partial<BusinessOnboardingData> => ({ iecCode, gstin, vatNumber, pan });

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!iecCode.trim() && !gstin.trim() && !vatNumber.trim()) {
      next.root = 'Provide at least one of IEC, GSTIN or VAT.';
    }
    if (iecCode.trim() && !IEC_RE.test(iecCode.trim())) next.iecCode = 'IEC must be 10 characters (letters/digits)';
    if (gstin.trim() && !GSTIN_RE.test(gstin.trim())) next.gstin = 'Invalid GSTIN format (15 characters)';
    if (pan.trim() && !PAN_RE.test(pan.trim())) next.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = () => {
    if (validate()) onNext(patch());
  };

  return (
    <div suppressHydrationWarning>
      <CardHeader className="text-center border-b border-border/50 pb-8">
        <CardTitle className="text-2xl font-bold tracking-tight">Trade &amp; Tax Registrations</CardTitle>
        <CardDescription>Import-Export Code, GST and VAT identifiers used for cross-border trade.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
          <span>At least one trade/tax registration is required. Provide all that apply to your jurisdiction.</span>
        </div>

        {errors.root && (
          <p className="text-[11px] text-destructive uppercase font-bold tracking-widest">{errors.root}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField label="IEC (Import-Export Code)" value={iecCode} onChange={upper(setIec)} placeholder="10-character IEC" hint="PAN-based 10-character code" error={errors.iecCode} />
          <TextField label="GSTIN" value={gstin} onChange={upper(setGstin)} placeholder="15-character GSTIN" hint="e.g. 22AAAAA0000A1Z5" error={errors.gstin} />
          <TextField label="VAT Number" value={vatNumber} onChange={upper(setVat)} placeholder="VAT registration number" hint="For VAT jurisdictions" />
          <TextField label="PAN (optional)" value={pan} onChange={upper(setPan)} placeholder="ABCDE1234F" error={errors.pan} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="h-12 font-bold uppercase tracking-widest" onClick={() => onBack(patch())}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button type="button" className="flex-1 h-12 font-bold uppercase tracking-widest" onClick={handleContinue}>
            Continue to Documents <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
