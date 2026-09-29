
import { ShieldCheck, Pickaxe, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

type BadgeType = "company" | "mining" | "exporter";

interface VerificationBadgeProps {
  type: BadgeType;
  className?: string;
}

export function VerificationBadge({ type, className }: VerificationBadgeProps) {
  const configs = {
    company: {
      icon: ShieldCheck,
      label: "Verified Entity",
      desc: "Level 2 Business Verification passed.",
      color: "text-blue-600 bg-blue-50 border-blue-100"
    },
    mining: {
      icon: Pickaxe,
      label: "Licensed Miner",
      desc: "Mining licenses verified by local authorities.",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100"
    },
    exporter: {
      icon: Award,
      label: "Platinum Exporter",
      desc: "Authorized international trade permits active.",
      color: "text-amber-600 bg-amber-50 border-amber-100"
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider cursor-default",
            config.color,
            className
          )}>
            <Icon className="h-3 w-3" />
            {config.label}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs p-2">
          <p className="font-bold">{config.label}</p>
          <p className="text-slate-500 opacity-80">{config.desc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
