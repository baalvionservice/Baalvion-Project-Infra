"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { typography, TypographyVariant } from "./typography";

interface TextProps {
  variant?: TypographyVariant;
  as?: React.ElementType;
  weight?: "normal" | "medium" | "semibold" | "bold";
  align?: "left" | "center" | "right" | "justify";
  color?: string;
  className?: string;
  children: React.ReactNode;
  title?: string;
  id?: string;
}

/**
 * A reusable Typography component for consistent text styling.
 */
export const Text = ({
  variant = "body",
  as: Component = "p",
  weight,
  align,
  color,
  className,
  children,
  title,
  id,
}: TextProps) => {
  const variantStyles = typography[variant];

  // Map internal weight tokens to tailwind classes if needed,
  // but for now we rely on the variant defaults or explicit override.
  const weightClass = weight ? `font-${weight}` : "";
  const alignClass = align ? `text-${align}` : "";

  return (
    <Component
      className={cn(
        "transition-colors",
        // We use tailwind classes for the scale for better responsiveness support via globals.css
        // but the variant name serves as our semantic hook.
        variant === "display" && "text-4xl lg:text-7xl font-headline",
        variant === "h1" && "text-3xl lg:text-5xl font-headline",
        variant === "h2" && "text-2xl lg:text-4xl font-headline",
        variant === "h3" && "text-xl lg:text-3xl font-headline",
        variant === "h4" && "text-lg lg:text-2xl font-headline",
        variant === "h5" && "text-base lg:text-xl font-headline",
        variant === "h6" && "text-sm lg:text-lg font-headline",
        variant === "body" && "text-base font-body",
        variant === "bodySmall" && "text-sm font-body",
        variant === "caption" && "text-xs font-body",
        variant === "label" &&
          "text-xs font-body uppercase tracking-wider font-semibold",
        weightClass,
        alignClass,
        className
      )}
      style={{ color }}
      title={title}
      id={id}
    >
      {children}
    </Component>
  );
};
