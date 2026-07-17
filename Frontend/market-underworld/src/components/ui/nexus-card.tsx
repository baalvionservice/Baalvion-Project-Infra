"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface NexusCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: 'base' | 'stats';
}

export const NexusCard = ({ children, className, delay = 0, variant = 'base' }: NexusCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className={cn(
        "mu-card relative overflow-hidden min-h-[120px]", // CLS Protection
        variant === 'stats' && "border-l-[3px] border-l-[hsl(var(--green-neon))] rounded-t-none",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const NexusBadge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: string, className?: string }) => {
  const variants: Record<string, string> = {
    default: "bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-secondary))]",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    success: "bg-[hsl(var(--green-subtle))] text-[hsl(var(--green-neon))] border border-[hsl(var(--green-border))]",
    warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    vip: "bg-white text-black",
    live: "bg-red-500 text-white font-bold",
  }

  return (
    <span className={cn(
      "px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-widest inline-flex items-center justify-center min-h-[20px]",
      variants[variant] || variants.default,
      className
    )}>
      {children}
    </span>
  );
}
