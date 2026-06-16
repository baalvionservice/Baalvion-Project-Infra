'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface OnboardingStepperProps {
  steps: string[];
  currentStep: number;
}

export function OnboardingStepper({ steps, currentStep }: OnboardingStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol role="list" className="flex items-start">
        {steps.map((stepName, stepIdx) => {
          const isComplete = stepIdx < currentStep;
          const isCurrent = stepIdx === currentStep;
          const isLast = stepIdx === steps.length - 1;

          return (
            <li key={stepName} className={cn('relative flex flex-col items-center', !isLast && 'flex-1')}>
              <div className="flex w-full items-center">
                <span
                  className={cn(
                    'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors',
                    isComplete && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background text-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]',
                    !isComplete && !isCurrent && 'border-border bg-background text-muted-foreground',
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : stepIdx + 1}
                </span>
                {!isLast && (
                  <span className="mx-2 h-0.5 flex-1 overflow-hidden rounded-full bg-border" aria-hidden="true">
                    <span
                      className={cn('block h-full bg-primary transition-all duration-300', isComplete ? 'w-full' : 'w-0')}
                    />
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'mt-2 w-max max-w-[7rem] text-center text-xs font-medium leading-tight sm:max-w-none',
                  isCurrent ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {stepName}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
