'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Plus, Trash2, UserPlus } from 'lucide-react';
import { TextField, SelectField } from './BusinessField';
import { ID_TYPES, type BeneficialOwner, type BusinessOnboardingData } from './options';

const SECTION_CLS = 'text-[11px] font-bold uppercase tracking-widest text-primary';
const newOwner = (): BeneficialOwner => ({ name: '', ownershipPct: '', nationality: '', idType: '', idNumber: '' });

interface Props {
  initial: BusinessOnboardingData;
  onNext: (patch: Partial<BusinessOnboardingData>) => void;
  onBack: (patch: Partial<BusinessOnboardingData>) => void;
}

export function KycStep({ initial, onNext, onBack }: Props) {
  const [name, setName] = useState(initial.authorizedSignatoryName);
  const [email, setEmail] = useState(initial.authorizedSignatoryEmail);
  const [idType, setIdType] = useState(initial.authorizedSignatoryIdType);
  const [idNumber, setIdNumber] = useState(initial.authorizedSignatoryIdNumber);
  const [owners, setOwners] = useState<BeneficialOwner[]>(initial.beneficialOwners);
  const [errors, setErrors] = useState<{ name?: string; idNumber?: string }>({});

  const patch = (): Partial<BusinessOnboardingData> => ({
    authorizedSignatoryName: name,
    authorizedSignatoryEmail: email,
    authorizedSignatoryIdType: idType,
    authorizedSignatoryIdNumber: idNumber,
    beneficialOwners: owners.filter((o) => o.name.trim().length > 0),
  });

  const updateOwner = (idx: number, key: keyof BeneficialOwner, value: string) =>
    setOwners((prev) => prev.map((o, i) => (i === idx ? { ...o, [key]: value } : o)));

  const removeOwner = (idx: number) => setOwners((prev) => prev.filter((_, i) => i !== idx));

  const handleContinue = () => {
    const next: typeof errors = {};
    if (name.trim().length > 0 && name.trim().length < 2) next.name = 'Enter a full name';
    if (idType && idNumber.trim().length === 0) next.idNumber = 'ID number required for selected ID type';
    setErrors(next);
    if (Object.keys(next).length === 0) onNext(patch());
  };

  return (
    <div suppressHydrationWarning>
      <CardHeader className="text-center border-b border-border/50 pb-8">
        <CardTitle className="text-2xl font-bold tracking-tight">Know Your Customer (KYC)</CardTitle>
        <CardDescription>Authorized signatory and beneficial ownership for compliance screening.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <p className={SECTION_CLS}>Authorized Signatory</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField label="Full Name" value={name} onChange={setName} placeholder="Signatory name" error={errors.name} />
          <TextField label="Email" value={email} onChange={setEmail} type="email" placeholder="signatory@company.com" />
          <SelectField label="ID Type" value={idType} onChange={setIdType} options={ID_TYPES} placeholder="Select ID" />
          <TextField label="ID Number" value={idNumber} onChange={setIdNumber} placeholder="Government ID number" error={errors.idNumber} />
        </div>

        <Separator className="bg-border/50" />
        <div className="flex items-center justify-between">
          <p className={SECTION_CLS}>Beneficial Owners</p>
          <Button type="button" variant="outline" size="sm" className="font-bold" onClick={() => setOwners((p) => [...p, newOwner()])}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {owners.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <UserPlus className="h-8 w-8 opacity-50" />
            <p className="text-[11px] uppercase font-bold tracking-widest">No beneficial owners added</p>
            <p className="text-xs">Add any individual holding 25% or more ownership.</p>
          </div>
        )}

        <div className="space-y-4">
          {owners.map((o, idx) => (
            <div key={idx} className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Owner {idx + 1}</span>
                <Button type="button" variant="ghost" size="sm" className="text-destructive h-7 px-2" onClick={() => removeOwner(idx)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField label="Name" value={o.name} onChange={(v) => updateOwner(idx, 'name', v)} placeholder="Owner name" />
                <TextField label="Ownership %" value={o.ownershipPct ?? ''} onChange={(v) => updateOwner(idx, 'ownershipPct', v)} type="number" placeholder="e.g. 30" />
                <TextField label="Nationality" value={o.nationality ?? ''} onChange={(v) => updateOwner(idx, 'nationality', v)} placeholder="e.g. Indian" />
                <SelectField label="ID Type" value={o.idType ?? ''} onChange={(v) => updateOwner(idx, 'idType', v)} options={ID_TYPES} placeholder="Select ID" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="h-12 font-bold uppercase tracking-widest" onClick={() => onBack(patch())}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button type="button" className="flex-1 h-12 font-bold uppercase tracking-widest" onClick={handleContinue}>
            Continue to Tax IDs <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
