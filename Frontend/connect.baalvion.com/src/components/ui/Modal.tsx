'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  variant?: 'default' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const ModalContext = React.createContext<{ variant: string }>({ variant: 'default' });

export function Modal({ 
  open, 
  onOpenChange, 
  children, 
  variant = 'default',
  size = 'md',
  className 
}: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[90vh]'
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md"
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                  className={cn(
                    "relative w-full overflow-hidden rounded-[2.5rem] bg-white shadow-2xl flex flex-col max-h-[90vh]",
                    sizeClasses[size],
                    className
                  )}
                >
                  <ModalContext.Provider value={{ variant }}>
                    {children}
                  </ModalContext.Provider>
                  
                  <DialogPrimitive.Close asChild>
                    <button className="absolute right-6 top-6 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all focus:outline-none ring-offset-background focus:ring-2 focus:ring-primary">
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </button>
                  </DialogPrimitive.Close>
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export function ModalHeader({ 
  children, 
  className,
  description
}: { 
  children: React.ReactNode; 
  className?: string;
  description?: string;
}) {
  const { variant } = React.useContext(ModalContext);
  
  const Icon = variant === 'danger' ? AlertTriangle : variant === 'success' ? CheckCircle2 : Info;
  const iconColor = variant === 'danger' ? 'text-red-600 bg-red-50' : variant === 'success' ? 'text-emerald-600 bg-emerald-50' : 'text-primary bg-primary/5';

  return (
    <div className={cn("p-8 pb-6 border-b shrink-0 bg-slate-50/30", className)}>
      <div className="flex items-center gap-4">
        <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <DialogPrimitive.Title className="text-2xl font-black text-slate-900 leading-none">
            {children}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="text-sm font-medium text-slate-500 mt-1.5">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
      </div>
    </div>
  );
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-8 overflow-y-auto flex-1 scrollbar-hide", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-8 border-t bg-slate-50/30 flex items-center justify-end gap-3 shrink-0", className)}>
      {children}
    </div>
  );
}
