import { Button } from "@/components/ui/button";
import { MailCheck } from "lucide-react";

type VerifyEmailStepProps = {
  onNext: () => void;
};

export default function VerifyEmailStep({ onNext }: VerifyEmailStepProps) {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <MailCheck className="h-12 w-12 text-primary" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Verify Your Email</h3>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link to your email address. Please check your inbox and click the link to continue.
        </p>
      </div>
      <Button onClick={onNext} className="w-full max-w-xs">
        I Have Verified My Email
      </Button>
      <Button variant="link" size="sm" className="text-muted-foreground">
        Didn't receive an email? Resend
      </Button>
    </div>
  );
}
