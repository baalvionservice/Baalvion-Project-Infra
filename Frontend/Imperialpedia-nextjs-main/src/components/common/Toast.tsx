'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info as InfoIcon, X } from 'lucide-react';
import { Text } from '@/design-system/typography/text';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  /** True while playing its exit transition, just before ToastManager unmounts it. */
  isExiting?: boolean;
  onClose: (id: string) => void;
}

/**
 * High-fidelity Intelligence Alert Component.
 * Institutional styling, CSS-only enter/exit transitions (tailwindcss-animate —
 * the same `animate-in`/`animate-out` pattern used by ui/dialog.tsx), and
 * automatic temporal decay. ARIA alert roles for real-time accessibility.
 */
export const Toast = ({ id, message, type = 'info', duration = 5000, isExiting, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />,
    info: <InfoIcon className="h-5 w-5 text-primary" />,
  };

  const borders = {
    success: 'border-emerald-500/20 bg-emerald-500/5',
    error: 'border-destructive/20 bg-destructive/5',
    info: 'border-primary/20 bg-primary/5',
  };

  return (
    <div
      className={cn(
        "glass-card flex items-center gap-4 p-4 pr-12 rounded-2xl border shadow-2xl min-w-[320px] max-w-md pointer-events-auto duration-200",
        isExiting
          ? "animate-out fade-out zoom-out-95"
          : "animate-in fade-in slide-in-from-bottom-2 zoom-in-95",
        borders[type]
      )}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="shrink-0" aria-hidden="true">{icons[type]}</div>
      <div className="flex-1">
        <Text variant="bodySmall" weight="bold" className="text-foreground/90">
          {message}
        </Text>
      </div>
      <button
        onClick={() => onClose(id)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
        aria-label="Dismiss alert"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
};
