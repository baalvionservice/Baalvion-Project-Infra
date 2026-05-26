
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RegistrationStep } from './RegistrationStep';
import { AccreditationStep } from './AccreditationStep';
import { CommitmentStep } from './CommitmentStep';
import { CompletionStep } from './CompletionStep';
import { cn } from '@/lib/utils';
import { ShieldCheck, User, Landmark, CheckCircle } from 'lucide-react';

export type OnboardingStep = 'register' | 'accreditate' | 'commit' | 'complete';

export function OnboardingFunnel() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('register');
  const [userData, setUserData] = useState<any>({});

  const steps: { key: OnboardingStep; label: string; icon: any }[] = [
    { key: 'register', label: 'Profile', icon: User },
    { key: 'accreditate', label: 'Accreditation', icon: ShieldCheck },
    { key: 'commit', label: 'Commitment', icon: Landmark },
    { key: 'complete', label: 'Verified', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = (data: any) => {
    setUserData({ ...userData, ...data });
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  };

  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Progress Indicator */}
      <div className="mb-8 space-y-4">
        <div className="flex justify-between">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = idx <= currentStepIndex;
            return (
              <div key={s.key} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                  isActive ? "border-primary bg-primary/10 text-primary" : "border-muted text-muted-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        {currentStep === 'register' && <RegistrationStep onNext={handleNext} />}
        {currentStep === 'accreditate' && <AccreditationStep onNext={handleNext} />}
        {currentStep === 'commit' && <CommitmentStep onNext={handleNext} />}
        {currentStep === 'complete' && <CompletionStep data={userData} />}
      </Card>
    </div>
  );
}
