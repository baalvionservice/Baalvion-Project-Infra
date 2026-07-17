"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

type NativeButtonProps = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'>;

interface ButtonProps extends NativeButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const AppButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
      secondary: "bg-black text-white hover:bg-gray-800",
      outline: "bg-transparent border border-black/10 text-black hover:bg-gray-50",
      ghost: "bg-transparent text-gray-500 hover:text-black hover:bg-gray-50",
    };

    const sizes = {
      sm: "px-4 py-2 text-xs font-semibold",
      md: "px-6 py-3 text-sm font-semibold",
      lg: "px-10 py-4 text-base font-semibold tracking-tight",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition-all focus:outline-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
AppButton.displayName = "AppButton";
