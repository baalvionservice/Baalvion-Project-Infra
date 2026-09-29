
'use client';

/**
 * @fileOverview Baalvion Custom Toast Notification System
 * 
 * Provides a standardized way to show branded feedback to users.
 * Built on react-hot-toast with custom visual fidelity.
 */

import { toast, ToastOptions } from 'react-hot-toast';

const DEFAULT_OPTIONS: ToastOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#FFFFFF',
    color: '#1E293B',
    borderRadius: '1.25rem',
    border: '1px solid #F1F5F9',
    padding: '1rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
};

/**
 * Success Toast - Used for completed actions (e.g. Save, Upload, Send)
 */
export const toastSuccess = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...DEFAULT_OPTIONS,
    iconTheme: {
      primary: '#10B981',
      secondary: '#FFFFFF',
    },
    ...options,
  });
};

/**
 * Error Toast - Used for critical failures
 */
export const toastError = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...DEFAULT_OPTIONS,
    style: {
      ...DEFAULT_OPTIONS.style,
      border: '1px solid #FEE2E2',
      background: '#FFF1F2',
      color: '#9F1239',
    },
    ...options,
  });
};

/**
 * Warning Toast - Used for non-critical alerts
 */
export const toastWarning = (message: string, options?: ToastOptions) => {
  return toast(message, {
    ...DEFAULT_OPTIONS,
    icon: '⚠️',
    style: {
      ...DEFAULT_OPTIONS.style,
      border: '1px solid #FFEDD5',
      background: '#FFF7ED',
      color: '#9A3412',
    },
    ...options,
  });
};

/**
 * Loading Toast - Used for async start states
 */
export const toastLoading = (message: string, options?: ToastOptions) => {
  return toast.loading(message, {
    ...DEFAULT_OPTIONS,
    ...options,
  });
};

/**
 * Promise Wrapper - Automatically handles loading -> success/error states
 */
export const toastPromise = <T,>(
  promise: Promise<T>,
  msgs: { loading: string; success: string; error: string },
  options?: ToastOptions
) => {
  return toast.promise(
    promise,
    {
      loading: msgs.loading,
      success: msgs.success,
      error: msgs.error,
    },
    {
      ...DEFAULT_OPTIONS,
      ...options,
    }
  );
};

export { toast };
