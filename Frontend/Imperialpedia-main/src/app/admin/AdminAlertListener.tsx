'use client';

import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { systemService } from '@/services/data/system-service';
import { AdminAlert } from '@/types/system';
import { ShieldAlert, FileText, UserCheck, Zap } from 'lucide-react';

/**
 * Administrative Background Monitor.
 * Simulates real-time polling for platform alerts and surfaces them as toasts.
 */
export function AdminAlertListener() {
  const { toast } = useToast();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations in dev strict mode
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function checkAlerts() {
      const response = await systemService.getAlerts();
      if (response.data && response.data.length > 0) {
        // For simulation, we'll just show the highest priority one first
        const alert = response.data[0];
        triggerToast(alert);
      }
    }

    const triggerToast = (alert: AdminAlert) => {
      const getIcon = () => {
        switch (alert.type) {
          case 'content': return <FileText className="h-4 w-4 text-primary" />;
          case 'user': return <UserCheck className="h-4 w-4 text-secondary" />;
          default: return <Zap className="h-4 w-4 text-amber-500" />;
        }
      };

      toast({
        title: `Admin Alert: ${alert.type.toUpperCase()}`,
        description: alert.message,
        variant: alert.priority === 'high' ? 'default' : 'default',
        action: (
          <div className="flex items-center justify-center p-2 bg-background/50 rounded-lg">
            {getIcon()}
          </div>
        )
      });
    };

    // Initial check after mount
    const timeout = setTimeout(checkAlerts, 2000);

    return () => clearTimeout(timeout);
  }, [toast]);

  return null; // Invisible monitoring component
}
