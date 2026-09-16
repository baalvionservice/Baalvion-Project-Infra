
'use client';

import { useState } from 'react';
import { OnboardingStepper } from './onboarding-stepper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Step1PersonalDetails } from './steps/step-1-personal-details';
import { Step2ProfessionalDetails } from './steps/step-2-professional-details';
import { Step3SkillsEducation } from './steps/step-3-skills-education';
import { Step4Review } from './steps/step-4-review';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const steps = ['Personal Details', 'Professional Details', 'Skills & Education', 'Review & Consent'];

export type OnboardingData = {
    // Personal
    fullName: string;
    profilePhoto?: File;
    location: string;
    // Professional
    lastJobTitle: string;
    lastCompany: string;
    salary?: number;
    currency?: string;
    proofDoc?: File;
    experience: string;
    // Skills
    skills: string;
    certifications?: File;
    degree: string;
    institute: string;
    gradYear: string;
    portfolioUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const { user, completeCandidateOnboarding } = useAuth();
  const [data, setData] = useState<Partial<OnboardingData>>({
      fullName: user?.name || '',
  });
  const router = useRouter();

  const handleNext = (stepData: Partial<OnboardingData>) => {
    const newData = { ...data, ...stepData };
    setData(newData);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step
      console.log('Candidate onboarding complete:', newData);
      // Here you would typically save all data to your backend
      completeCandidateOnboarding();
      router.push('/candidate/dashboard');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const renderStep = () => {
      switch (currentStep) {
          case 0: return <Step1PersonalDetails onNext={handleNext} data={data} />;
          case 1: return <Step2ProfessionalDetails onNext={handleNext} data={data} />;
          case 2: return <Step3SkillsEducation onNext={handleNext} data={data} />;
          case 3: return <Step4Review onNext={handleNext} data={data as OnboardingData} />;
          default: return null;
      }
  }

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          Step <span className="text-foreground">{currentStep + 1}</span> of {steps.length}
        </p>
        <p className="text-sm text-muted-foreground">{Math.round(((currentStep + 1) / steps.length) * 100)}% complete</p>
      </div>

      <div className="mb-10">
        <OnboardingStepper steps={steps} currentStep={currentStep} />
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{steps[currentStep]}</CardTitle>
          <CardDescription className="text-[15px]">
            {currentStep === 0
              ? "Let's start with the basics. This information will appear on your public profile."
              : currentStep === 1
                ? 'Tell us about your most recent professional experience.'
                : currentStep === 2
                  ? 'Showcase your expertise and educational background.'
                  : 'Review everything before finishing setup.'}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
        <CardFooter className="flex justify-between border-t bg-muted/30 py-4">
          <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
            Previous
          </Button>
          <Button type="submit" form={`step-${currentStep}-form`} size="lg" className="min-w-32 font-semibold">
            {isLastStep ? 'Finish setup' : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
