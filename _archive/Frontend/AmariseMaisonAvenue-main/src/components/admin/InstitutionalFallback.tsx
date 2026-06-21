'use client';

import React from 'react';
import { ShieldAlert, AlertCircle, Info, RefreshCcw } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface InstitutionalFallbackProps {
  module: string;
  error?: string;
  stack?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * InstitutionalFallback: Role-aware error display.
 * Super Admin sees technical details; Others see friendly Maison guidance.
 */
export function InstitutionalFallback({ 
  module, 
  error, 
  stack, 
  onRetry,
  className 
}: InstitutionalFallbackProps) {
  const { currentUser } = useAppStore();
  const isHighTier = currentUser?.role === 'super_admin' || currentUser?.role === 'country_admin';

  return (
    <Card className={cn("bg-red-50/30 border-red-100 shadow-sm overflow-hidden", className)}>
      <CardContent className="p-12 flex flex-col items-center text-center space-y-6">
        <div className="p-4 bg-red-100 rounded-full text-red-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-headline font-bold text-gray-900 italic">Institutional Anomaly Detected</h3>
          <p className="text-sm text-gray-500 font-light italic uppercase tracking-widest">{module} Subsystem</p>
        </div>

        <div className="max-w-md">
          {isHighTier ? (
            <div className="space-y-4">
              <p className="text-xs font-bold text-red-700 bg-red-100/50 p-3 border border-red-200 rounded-sm">
                {error || "An unexpected termination occurred within the module logic."}
              </p>
              {currentUser?.role === 'super_admin' && stack && (
                <div className="text-left bg-black text-green-400 p-4 rounded-sm font-mono text-[9px] overflow-x-auto max-h-32 custom-scrollbar">
                  {stack}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">
              "The Maison is currently refining this curatorial view. Our specialist team has been notified of the interval."
            </p>
          )}
        </div>

        <div className="pt-4 flex space-x-4">
          <Button 
            variant="outline" 
            className="h-10 border-red-200 text-red-700 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest px-8 rounded-none"
            onClick={onRetry}
          >
            <RefreshCcw className="w-3 h-3 mr-2" /> RE-INITIATE MODULE
          </Button>
          <Button 
            variant="ghost" 
            className="h-10 text-gray-400 text-[10px] font-bold uppercase tracking-widest px-8 rounded-none"
          >
            CONTACT SUPPORT
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
