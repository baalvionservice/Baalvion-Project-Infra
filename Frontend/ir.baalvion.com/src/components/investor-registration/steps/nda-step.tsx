"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { addMockEvent } from "@/lib/events";

type NdaStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function NdaStep({ onNext, onBack }: NdaStepProps) {
  const [agreed, setAgreed] = useState(false);

  const handleNextClick = () => {
    addMockEvent({ user: 'Investor', action: 'E-signed Non-Disclosure Agreement.', phase: 'P1' });
    onNext();
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Non-Disclosure Agreement</h3>
        <p className="text-sm text-muted-foreground">
          Please review and sign the NDA to proceed.
        </p>
      </div>
      
      <ScrollArea className="h-48 rounded-md border p-4">
        <p className="text-xs text-muted-foreground">
          This Non-Disclosure Agreement (the "Agreement") is entered into by and between the undersigned ("Recipient") and Baalvion ("Disclosing Party").
          <br /><br />
          1. Confidential Information. "Confidential Information" means any data or information that is proprietary to the Disclosing Party and not generally known to the public, whether in tangible or intangible form, whenever and however disclosed, including, but not limited to: (i) any marketing strategies, plans, financial information, or projections, operations, sales estimates, business plans and performance results relating to the past, present or future business activities of such party, its affiliates, subsidiaries and affiliated companies; (ii) plans for products or services, and customer or supplier lists; (iii) any scientific or technical information, invention, design, process, procedure, formula, improvement, technology or method; (iv) any concepts, reports, data, know-how, works-in-progress, designs, development tools, specifications, computer software, source code, object code, flow charts, databases, inventions, information and trade secrets; and (v) any other information that should reasonably be recognized as confidential information of the Disclosing Party.
          <br /><br />
          2. Non-disclosure. Recipient agrees not to use any Confidential Information for any purpose except to evaluate and engage in discussions concerning a potential business relationship between the parties. Recipient shall not disclose any Confidential Information to third parties or to such party's employees, except to those employees who are required to have the information in order to evaluate or engage in discussions concerning the contemplated business relationship.
          <br /><br />
          ... [Full legal text would continue here] ...
        </p>
      </ScrollArea>
      
      <div className="space-y-4 rounded-md border p-4">
        <h4 className="font-semibold">E-Signature</h4>
        <p className="text-xs text-muted-foreground">
          By checking the box and clicking "Agree & Sign", you are electronically signing and agreeing to the terms of this Non-Disclosure Agreement.
        </p>
        <div className="flex items-center space-x-2">
           <Checkbox 
            id="nda-agree" 
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
            aria-label="I agree to the terms of the NDA"
          />
          <Label htmlFor="nda-agree" className="text-sm font-medium leading-none cursor-pointer">
            I have read and agree to the terms of the NDA.
          </Label>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleNextClick} disabled={!agreed}>
          Agree & Sign
        </Button>
      </div>
    </div>
  );
}
