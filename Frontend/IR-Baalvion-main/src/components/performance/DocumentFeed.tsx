
"use client";

import { PerformanceDocument } from "@/types/performance";
import { UserRole } from "@/core/content/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Lock } from "lucide-react";
import { checkPermission } from "@/lib/rbac/checkPermission";
import { Badge } from "@/components/ui/badge";

interface Props {
  documents: PerformanceDocument[];
  currentRole: UserRole;
}

export function DocumentFeed({ documents, currentRole }: Props) {
  return (
    <Card className="bg-card/30 border-border/50">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Related Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((doc) => {
          const hasAccess = doc.restrictedTo.length === 0 || doc.restrictedTo.includes(currentRole) || currentRole === 'admin';
          
          return (
            <div 
              key={doc.id} 
              className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                hasAccess ? 'bg-background/50 border-border/50 hover:border-primary/30' : 'opacity-50 bg-muted/20 border-border/20 grayscale'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-primary/10">
                  {hasAccess ? <FileText className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-xs font-bold leading-tight">{doc.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-[8px] h-4 py-0 uppercase tracking-tighter">{doc.category}</Badge>
                    <span className="text-[9px] text-muted-foreground">Updated: {doc.lastUpdated}</span>
                  </div>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!hasAccess}>
                <Download className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
