'use client';

/**
 * @file access/request/page.tsx
 * @description Institution-type chooser for platform access. Every institution
 * type below already has a dedicated, config-driven onboarding wizard
 * (`/onboard/[department]`) that collects far more detail than a generic
 * intake form ever could — this page's only job is routing the visitor to the
 * right one, not duplicating the KYC/authority fields those wizards own.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ShieldAlert } from 'lucide-react';

const INSTITUTION_TYPES: { value: string; label: string; slug: string }[] = [
  { value: 'bank', label: 'Bank / Financial Institution', slug: 'banking' },
  { value: 'government', label: 'Government / Sovereign Entity', slug: 'government' },
  { value: 'regulator', label: 'Regulator', slug: 'government' },
  { value: 'customs', label: 'Customs Authority', slug: 'customs' },
  { value: 'enterprise', label: 'Enterprise (Importer/Exporter)', slug: 'enterprise' },
  { value: 'logistics', label: 'Logistics / Supply Chain Operator', slug: 'logistics' },
];

export default function AccessRequestPage() {
  const router = useRouter();
  const [institutionType, setInstitutionType] = useState('');

  const selected = INSTITUTION_TYPES.find((t) => t.value === institutionType);

  const handleContinue = () => {
    if (!selected) return;
    router.push(`/onboard/${selected.slug}`);
  };

  return (
    <div className="bg-muted/50">
      <div className="container py-20 md:py-28 max-w-2xl">
        <Card className="border-0 md:border shadow-none md:shadow-sm bg-card">
          <CardHeader className="text-center p-6 md:p-8">
            <CardTitle className="text-2xl md:text-3xl">Request Platform Access</CardTitle>
            <CardDescription className="text-md text-muted-foreground max-w-2xl mx-auto pt-2">
              Baalvion is a regulated, institution-grade trade infrastructure. Access is strictly limited to verified organizations and is granted following a formal review process.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 pt-0 space-y-8">
            <div className="space-y-6 p-6 border rounded-lg bg-muted/30">
              <h3 className="text-lg font-medium text-foreground">What kind of institution are you?</h3>
              <div className="space-y-2">
                <Label htmlFor="institution-type">Institution Type</Label>
                <Select value={institutionType} onValueChange={setInstitutionType}>
                  <SelectTrigger id="institution-type">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start gap-3 text-sm text-muted-foreground">
                <ShieldAlert className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                <p>You'll be taken to a dedicated verification wizard for your institution type — account details, authority/company documents, and compliance screening, all in one place.</p>
              </div>
            </div>

            <div className="flex flex-col items-center pt-2">
              <Button size="lg" disabled={!selected} onClick={handleContinue}>
                Continue to Application <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="mt-4 text-xs text-muted-foreground text-center max-w-sm">
                Every application is reviewed by our governance team before any access is granted.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
