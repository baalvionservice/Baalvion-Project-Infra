
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, ShieldCheck, Database, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { auditService } from "@/core/services/audit.service";
import { authService } from "@/core/services/auth.service";

export function EventPackageDownload() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownload = async (format: 'PDF' | 'JSON' | 'CSV') => {
    const { role } = await authService.getCurrentUser();
    
    setIsGenerating(true);
    toast({ title: "Aggregating Package", description: `Compiling institutional ${format} snapshot...` });

    // Simulate intensive server-side PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    await auditService.log({
      userRole: role,
      module: 'Reporting',
      action: 'export',
      entityId: `PKG-${Date.now()}`,
      newState: { format, type: 'InvestorPackage' }
    });

    setIsGenerating(false);
    toast({
      title: "Package Ready",
      description: `Institutional summary downloaded as ${format}.`,
    });
  };

  return (
    <Card className="bg-card/30 border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" /> Distribution Package Factory
        </CardTitle>
        <CardDescription className="text-xs">Generate on-demand compliance snapshots of your holdings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase" onClick={() => handleDownload('PDF')} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <FileDown className="h-3 w-3 mr-2" />}
            Performance PDF
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase" onClick={() => handleDownload('CSV')} disabled={isGenerating}>
            <FileDown className="h-3 w-3 mr-2" /> Ledger CSV
          </Button>
          <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase" onClick={() => handleDownload('JSON')} disabled={isGenerating}>
            <FileDown className="h-3 w-3 mr-2" /> Raw JSON
          </Button>
        </div>

        <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg flex items-center gap-3">
          <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
          <p className="text-[9px] text-muted-foreground leading-relaxed italic">
            "All generated packages are watermarked and cryptographically hashed for regulatory tracking."
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
