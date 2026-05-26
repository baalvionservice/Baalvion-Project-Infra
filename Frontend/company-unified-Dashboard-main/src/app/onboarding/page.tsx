
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import WelcomeStep from './components/welcome-step';
import BusinessSetupStep from './components/business-setup-step';
import InviteTeamStep from './components/invite-team-step';
import PlanStep from './components/plan-step';
import CompletionStep from './components/completion-step';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const router = useRouter();

  useEffect(() => {
    const savedStep = localStorage.getItem('onboardingStep');
    const savedData = localStorage.getItem('onboardingData');
    if (savedStep) {
      setStep(Number(savedStep));
    }
    if (savedData) {
      setFormData(JSON.parse(savedData));
    }
  }, []);

  const updateFormData = (data: any) => {
    const newData = { ...formData, ...data };
    setFormData(newData);
    localStorage.setItem('onboardingData', JSON.stringify(newData));
  };
  
  const nextStep = () => {
    const newStep = step + 1;
    setStep(newStep);
    localStorage.setItem('onboardingStep', String(newStep));
  };

  const prevStep = () => {
    const newStep = step - 1;
    setStep(newStep);
    localStorage.setItem('onboardingStep', String(newStep));
  };
  
  const startDemo = () => {
    localStorage.setItem('baalvion_demo_mode', 'true');
    router.push('/dashboard');
  };

  const handleFinish = () => {
    // In a real app, API calls would be made here with formData
    // e.g., POST /api/onboarding/setup
    localStorage.setItem('setup_complete', 'true');
    localStorage.removeItem('onboardingStep');
    localStorage.removeItem('onboardingData');
    router.push('/dashboard');
  }

  const steps = [
    { number: 1, title: "Welcome", component: <WelcomeStep onSetup={nextStep} onDemo={startDemo} /> },
    { number: 2, title: "Business Setup", component: <BusinessSetupStep onNext={nextStep} onBack={prevStep} updateFormData={updateFormData} formData={formData} /> },
    { number: 3, title: "Invite Your Team", component: <InviteTeamStep onNext={nextStep} onBack={prevStep} updateFormData={updateFormData} formData={formData} /> },
    { number: 4, title: "Choose Your Plan", component: <PlanStep onNext={nextStep} onBack={prevStep} updateFormData={updateFormData} /> },
    { number: 5, title: "All Done!", component: <CompletionStep onFinish={handleFinish} /> },
  ];

  const currentStepData = steps[step - 1];
  const progress = (step / (steps.length -1)) * 100; // Don't count welcome step in progress

  if (step === 1) {
    return currentStepData.component;
  }
  
  if (step === 5) {
     return (
        <Card className="w-full max-w-lg">
            <CardContent className="p-6">
                {currentStepData.component}
            </CardContent>
        </Card>
     );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Onboarding</CardTitle>
        <CardDescription>Step {currentStepData.number - 1} of {steps.length - 2}: {currentStepData.title}</CardDescription>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="min-h-[300px]">
        {currentStepData.component}
      </CardContent>
    </Card>
  );
}
