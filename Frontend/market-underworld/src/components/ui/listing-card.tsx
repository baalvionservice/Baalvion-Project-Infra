"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface CardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const ListingCard = ({ children, className, delay = 0 }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "rounded-3xl bg-white border border-black/[0.05] shadow-sm transition-all duration-300 hover:shadow-md p-8",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export const AppBadge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: string, className?: string }) => {
  const variants: Record<string, string> = {
    default: "bg-gray-100 text-gray-600",
    info: "bg-blue-50 text-blue-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-orange-50 text-orange-600",
    vip: "bg-black text-white",
    live: "bg-red-50 text-red-600",
  }

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
      variants[variant] || variants.default,
      className
    )}>
      {children}
    </span>
  )
}
