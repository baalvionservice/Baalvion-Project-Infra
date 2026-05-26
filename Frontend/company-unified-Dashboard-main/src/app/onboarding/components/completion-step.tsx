
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletionStepProps {
  onFinish: () => void;
}

const setupSteps = [
    "Creating your workspace...",
    "Configuring business unit...",
    "Inviting team members...",
    "Loading your dashboard..."
]

export default function CompletionStep({ onFinish }: CompletionStepProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
        setCompletedSteps(prev => {
            if (prev.length < setupSteps.length) {
                return [...prev, prev.length];
            }
            clearInterval(interval);
            return prev;
        });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const allDone = completedSteps.length === setupSteps.length;

  return (
    <div className="text-center py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Your Baalvion OS is ready! 🎉</h2>
        <p className="text-muted-foreground mb-8">We're just putting the finishing touches on your new workspace.</p>
        
        <div className="space-y-4 text-left max-w-sm mx-auto mb-8">
            {setupSteps.map((step, index) => (
                <div key={index} className={cn("flex items-center gap-3 transition-opacity duration-300", completedSteps.includes(index) ? 'opacity-100' : 'opacity-50')}>
                    <div className="w-5 h-5">
                       {completedSteps.includes(index) && <CheckCircle className="h-5 w-5 text-green-500 animate-in fade-in zoom-in" />}
                    </div>
                    <span>{step}</span>
                </div>
            ))}
        </div>

        <Button size="lg" onClick={onFinish} disabled={!allDone}>
            Go to Dashboard
        </Button>
    </div>
  );
}
