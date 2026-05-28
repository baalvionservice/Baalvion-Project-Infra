import { BadgeCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  verified: boolean;
  className?: string;
}

export const VerifiedBadge = ({ verified, className }: VerifiedBadgeProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={verified ? "secondary" : "outline"}
            className={
              (verified
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground border-muted-foreground/30") +
              " gap-1 " +
              (className ?? "")
            }
          >
            {verified ? (
              <>
                <BadgeCheck className="w-3.5 h-3.5" />
                Verified
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                Unverified
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {verified
            ? "Email verified"
            : "Verify your email to unlock all member actions"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
