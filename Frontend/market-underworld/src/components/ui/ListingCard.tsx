"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface ListingCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  variant?: 'base' | 'stats';
}

const FADE_UP = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      duration: 0.25,
      ease: [0.23, 1, 0.32, 1],
    },
  }),
};

export const ListingCard = ({ children, className, index = 0, variant = 'base' }: ListingCardProps) => {
  return (
    <motion.div
      variants={FADE_UP}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      custom={index}
      className={cn(
        "mu-card p-5 sm:p-6 lg:p-8 rounded-[8px] flex flex-col",
        // CLS Protection: Set minimum height and relative sizing
        "min-h-[180px] w-full relative overflow-hidden", 
        variant === 'stats' && "border-l-[3px] border-l-[#39FF14] rounded-tl-none",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: string, className?: string }) => {
  const variants: Record<string, string> = {
    default: "bg-[#181B21] text-[#C8CDD8]",
    info: "bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20",
    success: "bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20",
    vip: "bg-white text-black",
    live: "bg-[#EF4444] text-white font-bold",
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
