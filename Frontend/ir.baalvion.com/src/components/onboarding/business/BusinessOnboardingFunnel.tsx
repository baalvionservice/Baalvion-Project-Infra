'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Building2, ShieldCheck, Receipt, FileUp, ClipboardCheck, CheckCircle } from 'lucide-react';
import { CompanyStep } from './CompanyStep';
import { KycStep } from './KycStep';
import { TaxRegistrationStep } from './TaxRegistrationStep';
import { DocumentsStep } from './DocumentsStep';
import { ReviewSubmitStep } from './ReviewSubmitStep';
import { BusinessCompletionStep } from './BusinessCompletionStep';
import { emptyBusinessOnboardingData, type BusinessOnboardingData } from './options';

export type BusinessStep = 'company' | 'kyc' | 'tax' | 'documents' | 'review' | 'complete';

export interface SubmissionResult {
  reference?: string;
  status?: string;
  kycStatus?: string;
  documentsCount?: number;
}

const STEPS: { key: BusinessStep; label: string; icon: typeof Building2 }[] = [
  { key: 'company', label: 'Company', icon: Building2 },
  { key: 'kyc', label: 'KYC', icon: ShieldCheck },
  { key: 'tax', label: 'Tax IDs', icon: Receipt },
  { key: 'documents', label: 'Documents', icon: FileUp },
  { key: 'review', label: 'Review', icon: ClipboardCheck },
  { key: 'complete', label: 'Done', icon: CheckCircle },
];

export function BusinessOnboardingFunnel() {
  const [step, setStep] = useState<BusinessStep>('company');
  const [data, setData] = useState<BusinessOnboardingData>(emptyBusinessOnboardingData);
  const [result, setResult] = useState<SubmissionResult>({});

  const index = STEPS.findIndex((s) => s.key === step);
  const progress = ((index + 1) / STEPS.length) * 100;

  const goTo = (key: BusinessStep) => setStep(key);
  const merge = (patch: Partial<BusinessOnboardingData>) => setData((prev) => ({ ...prev, ...patch }));

  const next = (patch: Partial<BusinessOnboardingData>) => {
    merge(patch);
    const ni = index + 1;
    if (ni < STEPS.length) goTo(STEPS[ni].key);
  };

  const back = (patch: Partial<BusinessOnboardingData>) => {
    merge(patch);
    const pi = index - 1;
    if (pi >= 0) goTo(STEPS[pi].key);
  };

  return (
    <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 space-y-4">
        <div className="flex justify-between">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx <= index;
            return (
              <div key={s.key} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500',
                    isActive ? 'border-primary bg-primary/10 text-primary' : 'border-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-tighter',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        {step === 'company' && <CompanyStep initial={data} onNext={next} />}
        {step === 'kyc' && <KycStep initial={data} onNext={next} onBack={back} />}
        {step === 'tax' && <TaxRegistrationStep initial={data} onNext={next} onBack={back} />}
        {step === 'documents' && <DocumentsStep initial={data} onNext={next} onBack={back} />}
        {step === 'review' && (
          <ReviewSubmitStep
            data={data}
            onBack={() => goTo('documents')}
            onSubmitted={(r) => {
              setResult(r);
              goTo('complete');
            }}
          />
        )}
        {step === 'complete' && <BusinessCompletionStep data={data} result={result} />}
      </Card>
    </div>
  );
}
