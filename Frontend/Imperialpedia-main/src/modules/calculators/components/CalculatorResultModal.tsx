'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/design-system/typography/text';
import { CheckCircle2, Share2, Download, RefreshCcw } from 'lucide-react';

interface CalculatorResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  result: string;
  description: string;
  onReset?: () => void;
}

/**
 * A high-fidelity modal for presenting calculator results.
 * Optimized for institutional-grade visual hierarchy and accessibility.
 */
export const CalculatorResultModal = ({ 
  isOpen, 
  onClose, 
  title, 
  result, 
  description,
  onReset
}: CalculatorResultModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md glass-card border-primary/20 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-primary/5 p-8 text-center border-b border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <Text variant="label" className="text-primary mb-2">Calculation Complete</Text>
          <Text variant="h2" className="text-4xl font-bold mb-2">{result}</Text>
          <Text variant="bodySmall" className="text-muted-foreground">{title}</Text>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="p-4 rounded-2xl bg-card border border-white/5 italic text-sm text-center text-muted-foreground leading-relaxed">
            "{description}"
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="sm" className="h-11 rounded-xl">
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
            <Button variant="outline" size="sm" className="h-11 rounded-xl">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/20 border-t border-white/5 flex flex-row gap-3">
          <Button variant="ghost" onClick={onReset} className="flex-1 rounded-xl">
            <RefreshCcw className="mr-2 h-4 w-4" /> Recalculate
          </Button>
          <Button onClick={onClose} className="flex-1 bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20">
            Close Results
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
