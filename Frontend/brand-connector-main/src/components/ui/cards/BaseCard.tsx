'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BaseCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'glass';
}

export function BaseCard({ 
  children, 
  className, 
  variant = 'default',
  ...props 
}: BaseCardProps) {
  return (
    <motion.div
      whileHover={props.onClick ? { y: -4, scale: 1.01 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "rounded-[2rem] transition-shadow overflow-hidden",
        variant === 'default' && "bg-white border border-slate-100 shadow-sm hover:shadow-xl",
        variant === 'outline' && "bg-transparent border-2 border-slate-100",
        variant === 'glass' && "bg-white/10 backdrop-blur-md border border-white/20",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
