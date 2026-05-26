
'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface OnboardingStepperProps {
  steps: string[];
  currentStep: number;
}

export function OnboardingStepper({ steps, currentStep }: OnboardingStepperProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((stepName, stepIdx) => (
          <li key={stepName} className={cn('relative', stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-12 md:pr-20 flex-1' : '')}>
            {stepIdx < currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
              </>
            ) : stepIdx === currentStep ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                </div>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-background"
                >
                   <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                </div>
              </>
            )}
             <p className="absolute -bottom-7 w-max text-center text-xs text-muted-foreground">{stepName}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
}
