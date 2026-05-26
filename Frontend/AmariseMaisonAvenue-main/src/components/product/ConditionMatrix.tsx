'use client';

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConditionMatrixProps {
  condition?: string;
  className?: string;
}

/**
 * ConditionMatrix: Technical UI for Luxury Artifact Audit.
 * Provides granular evaluation of Leather, Hardware, and Interior.
 */
export function ConditionMatrix({ condition = 'PRISTINE', className }: ConditionMatrixProps) {
  const scores = {
    leather: 100,
    hardware: 100,
    interior: 98
  };

  return (
    <div className={cn("space-y-6 bg-[#fcfcfc] border border-gray-100 p-8 rounded-none", className)}>
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-4 h-4 text-secondary" />
          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-900">Institutional Audit</h4>
        </div>
        <span className="text-[10px] font-bold text-plum uppercase tracking-widest">{condition}</span>
      </div>

      <div className="space-y-5">
        <AuditRow label="Leather/Exterior" score={scores.leather} />
        <AuditRow label="Metal Hardware" score={scores.hardware} />
        <AuditRow label="Lining/Interior" score={scores.interior} />
      </div>

      <div className="pt-4 flex items-start space-x-3 opacity-40">
        <Info className="w-3 h-3 mt-0.5" />
        <p className="text-[8px] font-medium uppercase tracking-widest leading-relaxed">
          Each artifact is audited against the Maison’s 1924 quality charter. Documentation included.
        </p>
      </div>
    </div>
  );
}

function AuditRow({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-900">{score}%</span>
      </div>
      <div className="h-[1px] w-full bg-gray-100 relative">
        <div 
          className="absolute inset-y-0 left-0 bg-plum transition-all duration-1000" 
          style={{ width: `${score}%` }} 
        />
      </div>
    </div>
  );
}
