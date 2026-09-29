
'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductTourProps {
  onComplete: () => void;
}

const tourSteps = [
  {
    title: 'Your Command Center',
    description: "This is your Command Center — all businesses' key metrics at a glance.",
    position: { top: '190px', left: '280px', width: '300px' },
    arrow: 'top-left',
  },
  {
    title: 'Business Overview',
    description: 'Your businesses across 5 countries, all in one place.',
    position: { top: '650px', left: '280px', width: '300px' },
    arrow: 'top-left',
  },
  {
    title: 'Multi-Currency Support',
    description: "Track revenue in local currencies — we convert everything to your primary currency (USD) automatically.",
    position: { top: '820px', right: '400px', width: '300px' },
    arrow: 'top-right',
  },
  {
    title: 'Notifications & Alerts',
    description: "Set alerts so you never miss a KPI miss, and stay updated with important events.",
    position: { top: '80px', right: '150px', width: '300px' },
    arrow: 'top-right',
  },
  {
    title: 'Employee Management',
    description: 'Manage your global team, track attendance, tasks, and productivity from here.',
    position: { top: '350px', left: '20px', width: '300px' },
    arrow: 'top-left',
  },
   {
    title: 'Financial Tools',
    description: 'Finance, equity, and profit distribution — automated.',
    position: { top: '450px', left: '20px', width: '300px' },
    arrow: 'left-top',
  },
   {
    title: 'AI-Powered Insights',
    description: 'Get AI predictions for revenue, growth opportunities, and risks for the next 12 months.',
    position: { top: '450px', right: '20px', width: '300px' },
    arrow: 'top-right',
  },
  {
    title: 'Reporting',
    description: 'Generate investor-ready reports with one click.',
    position: { top: '600px', left: '20px', width: '300px' },
    arrow: 'left-bottom',
  },
];

export default function ProductTour({ onComplete }: ProductTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('baalvion_tour_completed', 'true');
    onComplete();
  };
  
  const currentStep = tourSteps[stepIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0">
        <Card style={currentStep.position} className={cn('absolute shadow-2xl animate-in fade-in-0 zoom-in-95', currentStep.arrow)}>
             <div className="absolute h-4 w-4 bg-card transform rotate-45"
                style={{
                    top: currentStep.arrow === 'top-left' || currentStep.arrow === 'top-right' ? '-8px' : 'auto',
                    bottom: currentStep.arrow === 'bottom-left' || currentStep.arrow === 'bottom-right' ? '-8px' : 'auto',
                    left: currentStep.arrow === 'top-left' || currentStep.arrow === 'bottom-left' ? '16px' : 'auto',
                    right: currentStep.arrow === 'top-right' || currentStep.arrow === 'bottom-right' ? '16px' : 'auto',
                }}
            />
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{currentStep.title}</CardTitle>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleFinish} aria-label="Close tour"><X className="h-4 w-4" /></Button>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription>{currentStep.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex justify-between">
                <span className="text-xs text-muted-foreground">Step {stepIndex + 1} of {tourSteps.length}</span>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleBack} disabled={stepIndex === 0}>Back</Button>
                    <Button size="sm" onClick={handleNext}>
                        {stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    </div>
  );
}
