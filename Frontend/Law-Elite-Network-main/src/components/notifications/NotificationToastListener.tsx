"use client";

import React, { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useLiveNotifications } from "@/hooks/useLiveNotifications";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ShieldCheck, BellRing } from "lucide-react";

/**
 * @fileOverview NotificationToastListener
 * Background observer that triggers real-time visual alerts for new network intelligence.
 */
export default function NotificationToastListener() {
  const { user } = useAuthStore();
  const { latestNotification } = useLiveNotifications(user?.id);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (latestNotification) {
      const isHighPriority = latestNotification.priority === 'high';
      
      toast({
        title: latestNotification.title,
        description: latestNotification.message,
        className: isHighPriority ? "border-accent/50 bg-accent/10" : "",
        action: latestNotification.relatedCaseId ? (
          <button 
            onClick={() => router.push(`/cases/${latestNotification.relatedCaseId}`)}
            className="text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-3 py-1 rounded-lg shadow-lg hover:scale-105 transition-all"
          >
            Audit Brief
          </button>
        ) : undefined
      });

      // Optional: Sound protocol for high-priority alerts
      if (isHighPriority && typeof window !== 'undefined') {
        // Implementation for subtle professional audio cue could go here
      }
    }
  }, [latestNotification, toast, router]);

  return null; // Silent observer component
}
