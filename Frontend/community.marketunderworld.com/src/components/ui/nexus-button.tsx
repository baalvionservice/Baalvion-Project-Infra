"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

type NativeButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'>;

interface NexusButtonProps extends NativeButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'vip';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const NexusButton = React.forwardRef<HTMLButtonElement, NexusButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      outline: "bg-transparent border border-[#252A33] text-white hover:border-[#39FF14] hover:text-[#39FF14]",
      ghost: "bg-transparent text-[#6B7280] hover:text-white",
      danger: "bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10",
      vip: "bg-white text-black",
    };

    const sizes = {
      sm: "h-10 px-4 text-[13px]",
      md: "h-12 px-6 text-[14px]",
      lg: "h-[56px] px-8 text-[15px]",
      xl: "h-[64px] px-10 text-[16px]",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center transition-all focus:outline-none disabled:opacity-50 font-bold rounded-[8px] min-w-[44px] min-h-[44px] touch-manipulation", // 44px min for touch targets
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-label="Loading" />
        ) : children}
      </motion.button>
    );
  }
);
NexusButton.displayName = "NexusButton";
