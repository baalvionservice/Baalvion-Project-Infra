
"use client"

import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, FileText, Gavel, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Lead } from "@/hooks/use-leads";

interface LeadStatsProps {
  leads: Lead[];
}

export function LeadStats({ leads }: LeadStatsProps) {
  const stats = [
    { label: "Survey Submissions", val: leads.length, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Blueprints Dispatched", val: leads.filter(l => l.pdfGenerated).length, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Conversion (Booked)", val: leads.filter(l => l.status === "Booked").length, icon: Gavel, color: "text-primary", bg: "bg-primary/5" },
    { label: "Avg. Industrial Score", val: "84", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <Card key={i} className="border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
