"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

type NativeButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'>;

interface AppButtonProps extends NativeButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'vip';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

const VARIANT_CLASSES = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "bg-transparent text-[#6B7280] hover:text-white",
  danger: "bg-transparent border border-[#EF4444] text-[#EF4444] hover:bg-[#EF4444]/10",
  vip: "bg-[#F59E0B] text-black font-bold shadow-lg shadow-[#F59E0B]/20",
};

const SIZE_CLASSES = {
  sm: "h-8 px-4 text-[13px]",
  md: "h-11 px-6 text-[14px]",
  lg: "h-[52px] px-8 text-[15px]",
  xl: "h-[60px] px-10 text-[16px]",
};

export const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-[6px] font-medium outline-none disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : children}
      </motion.button>
    );
  }
);

AppButton.displayName = "AppButton";