
"use client";

import { DocumentItem } from "@/lib/dataroom/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Lock, ShieldCheck, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentCardProps {
  doc: DocumentItem;
  hasAccess: boolean;
  onAction: (action: 'View' | 'Download') => void;
}

export function DocumentCard({ doc, hasAccess, onAction }: DocumentCardProps) {
  return (
    <Card className={cn(
      "group transition-all duration-300 border-border/50 bg-card/50 hover:bg-card hover:border-primary/30",
      !hasAccess && "opacity-60 grayscale"
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold opacity-70">
            {doc.category}
          </Badge>
          <Badge 
            variant={doc.accessLevelLabel === 'Public' ? 'secondary' : doc.accessLevelLabel === 'Board Only' ? 'destructive' : 'default'}
            className="text-[10px] font-bold"
          >
            {doc.accessLevelLabel}
          </Badge>
        </div>
        <CardTitle className="text-base font-bold leading-tight group-hover:text-primary transition-colors flex items-start gap-2">
          {!hasAccess && <Lock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />}
          {doc.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">
          {doc.description}
        </p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
          <span>Size: {doc.fileSize}</span>
          <span>Updated: {doc.lastUpdated}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs font-bold"
          disabled={!hasAccess}
          onClick={() => onAction('View')}
        >
          <Eye className="mr-2 h-3 w-3" /> View
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="flex-1 text-xs font-bold"
          disabled={!hasAccess}
          onClick={() => onAction('Download')}
        >
          <Download className="mr-2 h-3 w-3" /> Download
        </Button>
      </CardFooter>
    </Card>
  );
}
