'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  };

  return (
    <Loader2 
      className={cn("animate-spin text-primary", sizeMap[size], className)} 
      aria-label="Loading content"
    />
  );
}

export function PageLoader() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">Baalvion is loading your workspace...</span>
      <div className="relative">
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="bg-primary p-4 rounded-[2rem] shadow-2xl shadow-primary/20"
        >
          <Zap className="h-12 w-12 text-white fill-white" aria-hidden="true" />
        </motion.div>
        
        {/* Ring Animation */}
        <motion.div 
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 border-4 border-primary rounded-[2rem]"
          aria-hidden="true"
        />
      </div>
      
      <div className="mt-8 text-center space-y-2">
        <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Baalvion Connect</h2>
        <div className="flex items-center justify-center gap-2" aria-hidden="true">
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </motion.div>
  );
}
