import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = 'ORDER' | 'INVENTORY' | 'KYC' | 'RFQ' | 'ESCROW';

interface StatusBadgeProps {
  status: string;
  type: StatusType;
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase().replace(/\s+/g, '_');

  const getStyles = () => {
    switch (type) {
      case 'ORDER':
        if (normalizedStatus === 'SHIPPED') return "bg-primary/10 text-primary border-none";
        if (normalizedStatus === 'COMPLETED') return "bg-emerald-100 text-emerald-700 border-none";
        if (normalizedStatus === 'PROCESSING') return "bg-blue-100 text-blue-700 border-none";
        return "bg-slate-100 text-slate-600";
      
      case 'INVENTORY':
        if (normalizedStatus === 'ACTIVE') return "bg-emerald-100 text-emerald-700 border-none";
        if (normalizedStatus === 'SOLD_OUT') return "bg-rose-100 text-rose-700 border-none";
        return "bg-slate-100 text-slate-600";

      case 'KYC':
        if (normalizedStatus === 'VERIFIED') return "bg-emerald-100 text-emerald-700 border-none";
        if (normalizedStatus === 'PENDING') return "bg-amber-100 text-amber-700 border-none";
        if (normalizedStatus === 'UNDER_REVIEW') return "bg-blue-100 text-blue-700 border-none";
        return "bg-rose-100 text-rose-700";

      case 'ESCROW':
        if (normalizedStatus === 'HELD') return "text-amber-600 font-bold";
        if (normalizedStatus === 'RELEASED') return "text-emerald-600 font-bold";
        if (normalizedStatus === 'DISPUTED') return "text-rose-600 font-bold";
        return "";

      default:
        return "";
    }
  };

  return (
    <Badge className={cn(
      "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5",
      getStyles(),
      className
    )}>
      {status.replace('_', ' ')}
    </Badge>
  );
}
