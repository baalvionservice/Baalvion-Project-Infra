'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { TextField, SelectField } from './BusinessField';
import { ENTITY_TYPES, type BusinessOnboardingData } from './options';

type CompanyFields = Pick<
  BusinessOnboardingData,
  | 'legalName' | 'tradeName' | 'entityType' | 'incorporationCountry' | 'incorporationDate'
  | 'registrationNumber' | 'contactName' | 'contactEmail' | 'contactPhone' | 'website'
  | 'addressLine1' | 'addressLine2' | 'city' | 'stateRegion' | 'postalCode' | 'country'
>;

const COMPANY_KEYS: (keyof CompanyFields)[] = [
  'legalName', 'tradeName', 'entityType', 'incorporationCountry', 'incorporationDate',
  'registrationNumber', 'contactName', 'contactEmail', 'contactPhone', 'website',
  'addressLine1', 'addressLine2', 'city', 'stateRegion', 'postalCode', 'country',
];

const pickCompany = (d: BusinessOnboardingData): CompanyFields =>
  COMPANY_KEYS.reduce((acc, k) => ({ ...acc, [k]: d[k] }), {} as CompanyFields);

const SECTION_CLS = 'text-[11px] font-bold uppercase tracking-widest text-primary';

interface Props {
  initial: BusinessOnboardingData;
  onNext: (patch: Partial<BusinessOnboardingData>) => void;
}

export function CompanyStep({ initial, onNext }: Props) {
  const [form, setForm] = useState<CompanyFields>(pickCompany(initial));
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFields, string>>>({});

  const set = (key: keyof CompanyFields) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof CompanyFields, string>> = {};
    if (form.legalName.trim().length < 2) next.legalName = 'Legal name is required';
    if (!form.entityType) next.entityType = 'Select an entity type';
    if (form.incorporationCountry.trim().length < 2) next.incorporationCountry = 'Country of incorporation is required';
    if (form.contactName.trim().length < 2) next.contactName = 'Contact name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) next.contactEmail = 'A valid email is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onNext(form);
  };

  return (
    <form onSubmit={handleSubmit} suppressHydrationWarning>
      <CardHeader className="text-center border-b border-border/50 pb-8">
        <CardTitle className="text-2xl font-bold tracking-tight">Company Profile</CardTitle>
        <CardDescription>Register your business entity in the Baalvion trade registry.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <p className={SECTION_CLS}>Entity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField label="Legal Name" value={form.legalName} onChange={set('legalName')} placeholder="e.g. Acme Exports Pvt Ltd" required error={errors.legalName} />
          <TextField label="Trade / Brand Name" value={form.tradeName} onChange={set('tradeName')} placeholder="e.g. Acme" />
          <SelectField label="Entity Type" value={form.entityType} onChange={set('entityType')} options={ENTITY_TYPES} required error={errors.entityType} />
          <TextField label="Country of Incorporation" value={form.incorporationCountry} onChange={set('incorporationCountry')} placeholder="e.g. India" required error={errors.incorporationCountry} />
          <TextField label="Incorporation Date" value={form.incorporationDate} onChange={set('incorporationDate')} type="date" />
          <TextField label="Registration No. / CIN" value={form.registrationNumber} onChange={set('registrationNumber')} placeholder="Company registration number" />
        </div>

        <Separator className="bg-border/50" />
        <p className={SECTION_CLS}>Primary Contact</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField label="Contact Name" value={form.contactName} onChange={set('contactName')} placeholder="e.g. Asha Rao" required error={errors.contactName} />
          <TextField label="Work Email" value={form.contactEmail} onChange={set('contactEmail')} type="email" placeholder="name@company.com" required error={errors.contactEmail} />
          <TextField label="Phone" value={form.contactPhone} onChange={set('contactPhone')} placeholder="+91 …" />
          <TextField label="Website" value={form.website} onChange={set('website')} placeholder="https://company.com" hint="Include https://" />
        </div>

        <Separator className="bg-border/50" />
        <p className={SECTION_CLS}>Registered Address</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField label="Address Line 1" value={form.addressLine1} onChange={set('addressLine1')} placeholder="Street / building" />
          <TextField label="Address Line 2" value={form.addressLine2} onChange={set('addressLine2')} placeholder="Area / landmark" />
          <TextField label="City" value={form.city} onChange={set('city')} />
          <TextField label="State / Region" value={form.stateRegion} onChange={set('stateRegion')} />
          <TextField label="Postal Code" value={form.postalCode} onChange={set('postalCode')} />
          <TextField label="Country" value={form.country} onChange={set('country')} />
        </div>

        <Button type="submit" className="w-full h-12 font-bold uppercase tracking-widest mt-4">
          Continue to KYC <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </form>
  );
}
