import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, FileCheck2, Eye } from "lucide-react";
import type { License } from "@/lib/content/types";

/** Honest headline counts derived from real, publicly-visible records (0 now). */
export function ComplianceSummary({ licenses }: { licenses: License[] }) {
  const total = licenses.length;
  const active = licenses.filter((l) => l.status === "active").length;
  const visible = licenses.filter((l) => l.publiclyVisible).length;

  const stats = [
    { label: "Published records", value: total, Icon: FileCheck2 },
    { label: "Active", value: active, Icon: ShieldCheck },
    { label: "Publicly visible", value: visible, Icon: Eye },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map(({ label, value, Icon }) => (
        <Card key={label} className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-primary/5 p-3 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
