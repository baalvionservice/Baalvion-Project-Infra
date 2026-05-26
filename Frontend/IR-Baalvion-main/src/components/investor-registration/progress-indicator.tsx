import { cn } from "@/lib/utils"

type ProgressIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex w-full items-center justify-center gap-2 pt-4">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        return (
          <div
            key={step}
            className={cn(
              "h-2 flex-1 rounded-full",
              step <= currentStep ? "bg-primary" : "bg-muted"
            )}
            aria-label={`Step ${step} of ${totalSteps}`}
          />
        );
      })}
    </div>
  );
}
