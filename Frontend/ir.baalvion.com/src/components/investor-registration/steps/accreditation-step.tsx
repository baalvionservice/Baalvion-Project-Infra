"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { addMockEvent } from "@/lib/events";

type AccreditationStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function AccreditationStep({ onNext, onBack }: AccreditationStepProps) {
  const [agreed, setAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<"pass" | "fail" | null>(null);

  const handleContinue = () => {
    setIsProcessing(true);
    setProcessingResult(null);
    addMockEvent({ user: 'Investor', action: 'Submitted accreditation self-certification.', phase: 'P1' });

    // Placeholder for AI-powered screening
    setTimeout(() => {
      // Simulate a pass/fail result
      const result = Math.random() > 0.2 ? 'pass' : 'fail';
      addMockEvent({ user: 'System', action: `Accreditation AI screening result: ${result.toUpperCase()}`, phase: 'Admin' });
      setProcessingResult(result);
      setIsProcessing(false);
      
      if (result === 'pass') {
        setTimeout(onNext, 1000); // Go to next step after a short delay
      }
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Accreditation Self-Certification</h3>
        <p className="text-sm text-muted-foreground">
          Please confirm your status as an accredited investor.
        </p>
      </div>
      <div className="space-y-4 rounded-lg border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          By checking the box below, you hereby certify that you meet the requirements of an "accredited investor" as defined in Rule 501(a) of Regulation D under the Securities Act of 1933. This is a self-certification and may be subject to further verification by our AI-powered screening process.
        </p>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="accreditation-agree" 
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
            aria-label="I certify that I am an accredited investor"
            disabled={isProcessing}
          />
          <Label htmlFor="accreditation-agree" className="text-sm font-medium leading-none cursor-pointer">
            I certify that I am an accredited investor.
          </Label>
        </div>
      </div>
      
      {isProcessing && (
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI analyzing your certification...</span>
        </div>
      )}

      {processingResult === 'pass' && (
        <Alert variant="default" className="border-green-500 text-green-500">
          <AlertTitle>Preliminary Pass</AlertTitle>
          <AlertDescription>
            Your self-certification has passed the initial AI screening.
          </AlertDescription>
        </Alert>
      )}

      {processingResult === 'fail' && (
        <Alert variant="destructive">
          <AlertTitle>Further Review Required</AlertTitle>
          <AlertDescription>
            Our AI system flagged your application for further review. Our team will contact you for additional information.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!agreed || isProcessing || processingResult === 'fail'}>
          {isProcessing ? "Processing..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
