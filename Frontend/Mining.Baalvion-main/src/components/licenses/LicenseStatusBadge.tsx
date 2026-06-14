import { BadgeCheck, CalendarClock, Clock, AlertTriangle, CircleDashed } from "lucide-react";
import type { LicenseStatus } from "@/lib/content/types";

const MAP: Record<LicenseStatus, { label: string; cls: string; Icon: typeof BadgeCheck }> = {
  active: { label: "Active", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: BadgeCheck },
  renewing: { label: "Renewing", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: CalendarClock },
  pending: { label: "Pending", cls: "bg-slate-50 text-slate-600 border-slate-200", Icon: Clock },
  expired: { label: "Expired", cls: "bg-rose-50 text-rose-700 border-rose-200", Icon: AlertTriangle },
  "not-disclosed": { label: "On request", cls: "bg-white text-slate-500 border-slate-300", Icon: CircleDashed },
};

export function LicenseStatusBadge({ status }: { status: LicenseStatus }) {
  const { label, cls, Icon } = MAP[status] ?? MAP["not-disclosed"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
