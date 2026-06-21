import React from "react";
import { cn } from "@/lib/utils";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div";
  variant?: "heading" | "body" | "body-lg" | "label" | "muted";
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  as: Component = "p",
  variant = "body",
  className,
  ...props
}) => {
  const variants = {
    heading:
      "font-headline text-2xl md:text-3xl lg:text-4xl font-medium text-black",
    body: "text-body text-body-text leading-relaxed",
    "body-lg": "text-body-lg text-body-text leading-relaxed",
    label: "text-label tracking-label uppercase font-bold text-muted-text",
    muted: "text-body text-muted-text",
  };

  return (
    <Component className={cn(variants[variant], className)} {...props}>
      {children}
    </Component>
  );
};
