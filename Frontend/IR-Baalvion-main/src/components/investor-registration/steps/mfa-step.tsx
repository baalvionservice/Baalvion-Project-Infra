import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";

type MfaStepProps = {
  onNext: () => void;
};

export default function MfaStep({ onNext }: MfaStepProps) {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <ShieldCheck className="h-12 w-12 text-primary" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground">
          For your security, please enter the code sent to your authenticator app.
        </p>
      </div>
      <div className="flex w-full max-w-xs items-center space-x-2">
        <Input 
          type="text" 
          maxLength={6} 
          placeholder="123456" 
          className="text-center tracking-[0.5em]" 
          aria-label="Authentication code"
        />
      </div>
      <Button onClick={onNext} className="w-full max-w-xs">
        Verify Code
      </Button>
      <Button variant="link" size="sm" className="text-muted-foreground">
        Can't access your authenticator app?
      </Button>
    </div>
  );
}
