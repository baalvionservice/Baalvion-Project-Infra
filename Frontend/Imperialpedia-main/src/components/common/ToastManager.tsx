'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from './Toast';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  addToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook to access the Platform Intelligence Alert system.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastItem extends ToastOptions {
  id: string;
  exiting?: boolean;
}

// Must match Toast.tsx's exit-transition duration (`duration-200`) so an item is
// only dropped from state once its fade/zoom-out animation has actually finished.
const EXIT_ANIMATION_MS = 200;

/**
 * Global provider for managing the lifecycle of platform-wide alerts.
 * Always mounted (see RootLayoutClient), so it deliberately has no dependency
 * beyond React + CSS — removal is a two-phase state update (mark "exiting" so
 * Toast.tsx can play its CSS exit transition, then actually drop it) instead of
 * framer-motion's AnimatePresence, which previously pulled that animation
 * library into every single page's bundle just for this always-on provider.
 */
export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(({ message, type = 'info', duration = 5000 }: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} isExiting={t.exiting} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
