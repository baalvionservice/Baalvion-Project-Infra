import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, ExternalLink } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
  variant?: "default" | "minimal" | "card";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "minimal") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-8 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <Icon className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {primaryAction && (
          <Button variant="link" size="sm" onClick={primaryAction.onClick} className="mt-2">
            {primaryAction.label}
          </Button>
        )}
      </motion.div>
    );
  }

  if (variant === "card") {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {primaryAction && (
                <Button variant="hero" onClick={primaryAction.onClick}>
                  {primaryAction.icon && <primaryAction.icon className="w-4 h-4 mr-2" />}
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  variant="ghost"
                  onClick={secondaryAction.onClick}
                  asChild={!!secondaryAction.href}
                >
                  {secondaryAction.href ? (
                    <a href={secondaryAction.href} target="_blank" rel="noopener noreferrer">
                      {secondaryAction.label}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  ) : (
                    secondaryAction.label
                  )}
                </Button>
              )}
            </div>
            {children}
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Icon className="w-10 h-10 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
          <span className="text-xs">0</span>
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-8">{description}</p>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {primaryAction && (
          <Button variant="hero" size="lg" onClick={primaryAction.onClick}>
            {primaryAction.icon && <primaryAction.icon className="w-5 h-5 mr-2" />}
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            size="lg"
            onClick={secondaryAction.onClick}
            asChild={!!secondaryAction.href}
          >
            {secondaryAction.href ? (
              <a href={secondaryAction.href} target="_blank" rel="noopener noreferrer">
                {secondaryAction.label}
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            ) : (
              secondaryAction.label
            )}
          </Button>
        )}
      </div>
      {children}
    </motion.div>
  );
}
