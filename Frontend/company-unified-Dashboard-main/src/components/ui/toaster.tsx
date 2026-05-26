"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const isSuccess = props.variant !== 'destructive';
        const duration = isSuccess ? 3000 : Infinity;

        return (
          <Toast key={id} {...props} duration={duration}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
            {isSuccess && <div className="absolute bottom-0 left-0 h-1 bg-primary/20 toast-progress" style={{ animationDuration: `3000ms` }}/>}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
