
'use client';

import { useState } from 'react';
import { OnboardingStepper } from './onboarding-stepper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Step1CompanyDetails } from './steps/step-1-company-details';
import { Step2VerificationDocs } from './steps/step-2-verification-docs';
import { Step2InviteUsers } from './steps/step-2-invite-users';
import { Step3CreateTask } from './steps/step-3-create-task';
import { Step4Review } from './steps/step-4-review';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const steps = ['Company Details', 'Verification', 'Invite Team', 'Create Task', 'Review & Finish'];

export type OnboardingData = {
    companyName: string;
    companyWebsite: string;
    companyDescription: string;
    country: string;
    documents: { [key: string]: File | undefined };
    invitedUsers: string[];
    taskTitle: string;
    taskDescription: string;
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({
    companyName: '',
    companyWebsite: '',
    companyDescription: '',
    country: 'United States',
    documents: {},
    invitedUsers: [],
    taskTitle: '',
    taskDescription: '',
  });
  const { user, updateUser } = useAuth();
  const router = useRouter();

  const handleNext = (stepData: Partial<OnboardingData>) => {
    const newData = { ...data, ...stepData };
    setData(newData);
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step
      console.log('Onboarding complete:', newData);
      // Here you would typically save all data to your backend
      updateUser({ onboardingCompleted: true });
      router.push('/company/dashboard');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const renderStep = () => {
      switch (currentStep) {
          case 0: return <Step1CompanyDetails onNext={handleNext} data={data} />;
          case 1: return <Step2VerificationDocs onNext={handleNext} data={data} />;
          case 2: return <Step2InviteUsers onNext={handleNext} data={data} />;
          case 3: return <Step3CreateTask onNext={handleNext} data={data} />;
          case 4: return <Step4Review onNext={handleNext} data={data as OnboardingData} />;
          default: return null;
      }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
        <OnboardingStepper steps={steps} currentStep={currentStep} />
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{steps[currentStep]}</CardTitle>
                <CardDescription>
                    {
                        currentStep === 0 ? "Let's start with the basics. Tell us about your company." :
                        currentStep === 1 ? 'Please provide the required documents for verification.' :
                        currentStep === 2 ? "Invite your team members to collaborate." :
                        currentStep === 3 ? "Let's create your first task to attract candidates." :
                        "Please review the information below before completing your setup."
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderStep()}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={handlePrev} disabled={currentStep === 0}>
                    Previous
                </Button>
                 <Button type="submit" form={`step-${currentStep}-form`}>
                    {currentStep === steps.length - 1 ? 'Finish Setup' : 'Next'}
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
