import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

type CompletionStepProps = {
  closeModal: () => void;
  flowType: "phase1" | "phase2";
};

export default function CompletionStep({ closeModal, flowType }: CompletionStepProps) {
  const messages = {
    phase1: {
      title: "Application Submitted",
      description: "Thank you for your interest in Baalvion. Our team will review your application and contact you within 5-7 business days."
    },
    phase2: {
      title: "Onboarding Complete",
      description: "Your documentation has been submitted for final review. You will be redirected to your dashboard momentarily. Our team will contact you regarding next steps for capital calls."
    }
  }

  const { title, description } = messages[flowType];

  return (
    <div className="flex flex-col items-center justify-center space-y-6 text-center">
      <CheckCircle2 className="h-16 w-16 text-green-500" />
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">
          {description}
        </p>
      </div>
      <Button onClick={closeModal} className="w-full sm:w-auto">
        Close
      </Button>
    </div>
  );
}
