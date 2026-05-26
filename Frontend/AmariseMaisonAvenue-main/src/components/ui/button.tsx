import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "destructive"
    | "default";
  size?: "sm" | "md" | "lg" | "icon";
  asChild?: boolean;
  children: React.ReactNode;
}

export const buttonVariants = (props?: {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "destructive"
    | "default";
}) => {
  const variant = props?.variant || "primary";
  const variants = {
    primary: "bg-black text-white hover:bg-body-text",
    secondary:
      "bg-cream text-black border border-border-color hover:bg-muted-text hover:text-white",
    ghost: "bg-transparent text-body-text hover:text-black",
    outline:
      "border border-border-color bg-transparent hover:bg-black hover:text-white",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    default: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  };
  return variants[variant];
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      asChild = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center text-label tracking-label uppercase font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

    const variants = {
      primary: "bg-black text-white hover:bg-body-text",
      secondary:
        "bg-cream text-black border border-border-color hover:bg-muted-text hover:text-white",
      ghost: "bg-transparent text-body-text hover:text-black",
      outline:
        "border border-border-color bg-transparent hover:bg-black hover:text-white",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      default: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    };

    const sizes = {
      sm: "h-9 px-3 text-[10px]",
      md: "h-11 px-4 text-label",
      lg: "h-12 px-6 text-label",
      icon: "h-10 w-10",
    };

    if (asChild) {
      return React.cloneElement(
        children as React.ReactElement,
        {
          className: cn(baseStyles, variants[variant], sizes[size], className),
          ref,
          ...props,
        } as any
      );
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
