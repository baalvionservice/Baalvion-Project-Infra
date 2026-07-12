
"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Toast as ToastType } from '@/context/notification-context';
import { Check, X, AlertTriangle, Info, Trophy, Wallet, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ToastContainer = () => {
  const { toasts, removeToast } = useNotifications();

  return (
    <div className="fixed top-24 right-8 z-[9999] pointer-events-none flex flex-col gap-3 w-full max-w-[400px] items-end px-4 sm:px-0">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: ToastType; onRemove: () => void }) => {
  React.useEffect(() => {
    const timer = setTimeout(onRemove, toast.duration || 5000);
    return () => clearTimeout(timer);
  }, [onRemove, toast.duration]);

  const config = {
    success: { icon: <Check className="w-5 h-5" />, color: 'bg-emerald-500', bar: 'bg-emerald-500' },
    error: { icon: <X className="w-5 h-5" />, color: 'bg-red-500', bar: 'bg-red-500' },
    warning: { icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-amber-500', bar: 'bg-amber-500' },
    info: { icon: <Info className="w-5 h-5" />, color: 'bg-blue-500', bar: 'bg-blue-500' },
    achievement: { icon: <Trophy className="w-5 h-5" />, color: 'bg-amber-500', bar: 'bg-gradient-to-r from-amber-400 to-yellow-600' },
    payment: { icon: <Wallet className="w-5 h-5" />, color: 'bg-emerald-500', bar: 'bg-emerald-500' },
    class: { icon: <Video className="w-5 h-5" />, color: 'bg-red-500', bar: 'bg-red-500' },
  }[toast.type];

  return (
    <motion.div
      layout
      initial={{ x: 100, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 100, opacity: 0, scale: 0.9 }}
      className="pointer-events-auto w-full bg-[#16161F]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden group"
    >
      <div className="flex gap-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg", config.color)}>
          {config.icon}
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-bold text-sm text-white">{toast.title}</h4>
          <p className="text-xs text-gray-400 leading-relaxed">{toast.message}</p>
          {toast.action && (
            <button 
              onClick={toast.action.onClick}
              className="mt-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button onClick={onRemove} className="p-1 text-gray-600 hover:text-white transition-colors h-fit">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress Bar */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: (toast.duration || 5000) / 1000, ease: 'linear' }}
        className={cn("absolute bottom-0 left-0 h-0.5", config.bar)}
      />
    </motion.div>
  );
};
