
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Eye } from 'lucide-react';

interface WelcomeStepProps {
  onSetup: () => void;
  onDemo: () => void;
}

export default function WelcomeStep({ onSetup, onDemo }: WelcomeStepProps) {
  return (
    <Card className="w-full max-w-lg text-center">
        <CardHeader>
            <CardTitle className="text-3xl">Welcome to Baalvion!</CardTitle>
            <CardDescription className="text-lg">Let's set up your Business OS in 3 minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button size="lg" className="w-full h-16 text-lg" onClick={onSetup}>
                <Briefcase className="mr-2" />
                I'm Setting Up a Real Business
            </Button>
             <Button size="lg" variant="outline" className="w-full h-16 text-lg" onClick={onDemo}>
                <Eye className="mr-2" />
                Show Me a Demo First
            </Button>
        </CardContent>
    </Card>
  );
}
