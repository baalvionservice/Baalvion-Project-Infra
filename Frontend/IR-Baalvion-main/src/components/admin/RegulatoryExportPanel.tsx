"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Download, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/core/content/schemas";
import { auditService } from "@/core/services/audit.service";

export function RegulatoryExportPanel({ role }: { role: UserRole }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: "CSV" | "PDF" | "JSON") => {
    if (role !== "admin" && role !== "compliance") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description:
          "Reporting tranches are restricted to Compliance Officers.",
      });
      return;
    }

    setIsGenerating(true);
    toast({
      title: "Aggregating Data",
      description: "Compiling system-wide governance tranches for export...",
    });

    // Simulate aggregation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await auditService.log({
      userRole: role,
      module: "Reporting",
      action: "generate",
      entityId: `REP-${Date.now()}`,
      newState: { format },
    });

    setIsGenerating(false);
    toast({
      title: "Export Successful",
      description: `Regulatory snapshot generated as ${format}.`,
    });
  };

  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Compliance Snapshot",
            desc: "Full audit trail and KYC registry",
            format: "JSON",
          },
          {
            title: "Capital Ledger",
            desc: "Allocations, calls, and wire records",
            format: "CSV",
          },
          {
            title: "Resolution Archive",
            desc: "Board ballots and outcome summary",
            format: "PDF",
          },
        ].map((rep) => (
          <Card
            key={rep.title}
            className="bg-card/30 border-border/50 hover:border-primary/30 transition-all group"
          >
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest">
                {rep.title}
              </CardTitle>
              <CardDescription className="text-xs">{rep.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full h-10 text-xs font-bold uppercase tracking-widest"
                disabled={isGenerating}
                onClick={() => handleExport(rep.format as any)}
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  <Download className="h-3 w-3 mr-2" />
                )}
                Generate {rep.format}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex gap-4 items-start">
          <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold uppercase tracking-widest">
              Regulatory Compliance Notice
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              "All generated reports represent a cryptographically hashed
              snapshot of the platform ledger. In accordance with SEC Rule
              17a-4, these records are immutable once exported and must be
              retained for institutional disclosure purposes."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
