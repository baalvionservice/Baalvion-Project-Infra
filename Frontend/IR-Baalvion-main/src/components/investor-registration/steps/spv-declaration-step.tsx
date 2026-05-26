"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

type SpvDeclarationStepProps = {
  onNext: () => void;
  onBack: () => void;
};

export default function SpvDeclarationStep({ onNext, onBack }: SpvDeclarationStepProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">SPV Declaration & Acknowledgement</h3>
        <p className="text-sm text-muted-foreground">
          Please review and acknowledge the nature of this SPV investment.
        </p>
      </div>
      
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4"/>
        <AlertTitle>Important: Read Carefully</AlertTitle>
        <AlertDescription>
          This declaration outlines the specific risks and structure of a Special Purpose Vehicle (SPV).
        </AlertDescription>
      </Alert>

      <ScrollArea className="h-48 rounded-md border p-4">
        <p className="text-xs text-muted-foreground">
          This SPV Declaration (the "Declaration") is made by the undersigned ("Investor") in connection with the investment in the designated Special Purpose Vehicle ("SPV") managed by Baalvion or its affiliates.
          <br /><br />
          1. <strong>Nature of SPV:</strong> The Investor acknowledges that the SPV is a distinct legal entity formed for the sole purpose of investing in a specific target company or asset ("Underlying Asset"). The investment is non-pooled and is confined to the success or failure of this single Underlying Asset.
          <br /><br />
          2. <strong>Illiquidity:</strong> The Investor understands that interests in the SPV are highly illiquid and are not publicly traded. There are significant restrictions on transferring interests, and the investment should be considered a long-term commitment.
          <br /><br />
          3. <strong>Risk of Loss:</strong> The Investor acknowledges that this investment carries a high degree of risk, including the potential for a total loss of the invested capital. The success of the investment is entirely dependent on the performance of the Underlying Asset.
          <br /><br />
          4. <strong>Profit-Sharing Structure:</strong> The Investor agrees to the profit-sharing arrangement ("Carried Interest") as detailed in the SPV's Private Placement Memorandum (PPM), whereby the SPV's manager is entitled to a percentage of the profits after a predetermined hurdle rate is met.
          <br /><br />
          By signing, the Investor confirms they have read the PPM, understand these risks, and qualify as an accredited investor capable of bearing such risks.
        </p>
      </ScrollArea>
      
      <div className="space-y-4 rounded-md border p-4">
        <h4 className="font-semibold">E-Signature</h4>
        <p className="text-xs text-muted-foreground">
          By checking the box and clicking "Acknowledge & Continue", you are electronically signing and attesting that you understand and agree to the terms of this SPV Declaration.
        </p>
        <div className="flex items-center space-x-2">
           <Checkbox 
            id="spv-agree" 
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
            aria-label="I agree to the terms of the SPV Declaration"
          />
          <Label htmlFor="spv-agree" className="text-sm font-medium leading-none cursor-pointer">
            I have read, understood, and agree to the SPV Declaration.
          </Label>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!agreed}>
          Acknowledge & Continue
        </Button>
      </div>
    </div>
  );
}
