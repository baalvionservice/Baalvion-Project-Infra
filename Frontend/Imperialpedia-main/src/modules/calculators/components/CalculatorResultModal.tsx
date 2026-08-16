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
import { CheckCircle2, RefreshCcw } from 'lucide-react';

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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 p-8 text-center border-b border-gray-100">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <Text variant="label" className="text-gray-400 uppercase tracking-widest text-xs mb-2">Result</Text>
          <Text variant="h2" className="text-4xl font-bold mb-2 text-foreground">{result}</Text>
          <Text variant="bodySmall" className="text-muted-foreground">{title}</Text>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 italic text-sm text-center text-gray-500 leading-relaxed">
            "{description}"
          </div>

          <Text variant="caption" className="block text-center text-muted-foreground">
            Estimate only, based on the inputs above — not a guarantee of future results or investment advice.
          </Text>
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100 flex flex-row gap-3">
          <Button variant="ghost" onClick={onReset} className="flex-1">
            <RefreshCcw className="mr-2 h-4 w-4" /> Recalculate
          </Button>
          <Button onClick={onClose} className="flex-1 font-semibold">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
