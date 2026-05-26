import { useEffect, useRef } from "react";
import { Proxy, ProxyStatus } from "@/types/proxy";
import { toast } from "@/hooks/use-toast";

interface ProxyChange {
  proxy: Proxy;
  previousStatus: ProxyStatus;
  newStatus: ProxyStatus;
}

export const useProxyNotifications = (proxies: Proxy[], enabled = true) => {
  const previousProxiesRef = useRef<Map<number, ProxyStatus>>(new Map());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // Initialize on first run
    if (!isInitializedRef.current) {
      proxies.forEach((proxy) => {
        previousProxiesRef.current.set(proxy.id, proxy.status);
      });
      isInitializedRef.current = true;
      return;
    }

    const changes: ProxyChange[] = [];

    proxies.forEach((proxy) => {
      const previousStatus = previousProxiesRef.current.get(proxy.id);
      
      if (previousStatus && previousStatus !== proxy.status) {
        changes.push({
          proxy,
          previousStatus,
          newStatus: proxy.status,
        });
      }
      
      previousProxiesRef.current.set(proxy.id, proxy.status);
    });

    // Show notifications for status changes
    changes.forEach(({ proxy, previousStatus, newStatus }) => {
      const statusMessages: Record<ProxyStatus, { title: string; variant: "default" | "destructive" }> = {
        active: { title: "Proxy Back Online", variant: "default" },
        maintenance: { title: "Proxy Under Maintenance", variant: "default" },
        limited: { title: "Proxy Limited", variant: "default" },
        offline: { title: "Proxy Offline", variant: "destructive" },
      };

      const { title, variant } = statusMessages[newStatus];

      toast({
        title,
        description: `${proxy.city}, ${proxy.country} (${proxy.ip}) changed from ${previousStatus} to ${newStatus}`,
        variant,
      });
    });
  }, [proxies, enabled]);
};
