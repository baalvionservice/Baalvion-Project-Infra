'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { LucideIcon } from 'lucide-react';

export interface NodeDetailRow {
  label: string;
  value: string;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  description: string;
  rows: NodeDetailRow[];
};

export function NodeDetailDialog({ open, onOpenChange, icon: Icon, title, description, rows }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 uppercase tracking-tight">
            <Icon className="h-5 w-5 text-primary" /> {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1 py-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between border-b border-border/50 py-2.5 last:border-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{row.label}</span>
              <span className="text-sm font-bold text-right">{row.value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
