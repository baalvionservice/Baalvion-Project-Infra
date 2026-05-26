import { useState, useEffect, useCallback } from "react";
import { Proxy } from "@/types/proxy";
import { enhancedProxyList } from "@/data/proxyData";

// Simulate real-time updates to proxy data
export const useRealTimeProxyData = (interval = 5000, enabled = true) => {
  const [proxies, setProxies] = useState<Proxy[]>(enhancedProxyList);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const simulateUpdate = useCallback(() => {
    setProxies((current) =>
      current.map((proxy) => {
        // Only update active proxies
        if (proxy.status === "offline") return proxy;

        // Simulate small changes
        const bandwidthChange = Math.floor(Math.random() * 50) - 10;
        const latencyChange = Math.floor(Math.random() * 10) - 5;
        const successRateChange = (Math.random() - 0.5) * 0.3;

        return {
          ...proxy,
          bandwidthUsed: Math.max(0, Math.min(proxy.bandwidthLimit, proxy.bandwidthUsed + bandwidthChange)),
          avgLatency: Math.max(10, proxy.avgLatency + latencyChange),
          successRate: Math.max(90, Math.min(100, proxy.successRate + successRateChange)),
          lastChecked: "Just now",
          totalRequests: proxy.totalRequests + Math.floor(Math.random() * 100),
        };
      })
    );
    setLastUpdated(new Date());
  }, []);

  const manualRefresh = useCallback(() => {
    setIsRefreshing(true);
    simulateUpdate();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [simulateUpdate]);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(simulateUpdate, interval);
    return () => clearInterval(intervalId);
  }, [interval, enabled, simulateUpdate]);

  return { proxies, lastUpdated, isRefreshing, refresh: manualRefresh };
};

// Org-specific base stats for seeding real-time simulation
const orgBaseStats: Record<string, { totalBandwidth: string; activeProxies: number; successRate: number; avgLatency: number; bandwidthChange: string; proxyChange: string; successChange: string; latencyChange: string }> = {
  "acme-corp": { totalBandwidth: "2.4 TB", activeProxies: 2847, successRate: 99.4, avgLatency: 142, bandwidthChange: "+12%", proxyChange: "+5%", successChange: "+0.3%", latencyChange: "-8%" },
  "zenith-data": { totalBandwidth: "890 GB", activeProxies: 842, successRate: 98.7, avgLatency: 189, bandwidthChange: "+8%", proxyChange: "+3%", successChange: "+0.1%", latencyChange: "-4%" },
  "nova-systems": { totalBandwidth: "62 GB", activeProxies: 47, successRate: 97.2, avgLatency: 234, bandwidthChange: "+2%", proxyChange: "+1%", successChange: "-0.2%", latencyChange: "+3%" },
};

// Simulate real-time dashboard stats
export const useRealTimeDashboardStats = (interval = 3000, enabled = true, orgId = "acme-corp") => {
  const base = orgBaseStats[orgId] || orgBaseStats["acme-corp"];
  const [stats, setStats] = useState({ ...base });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Reset stats when org changes
  useEffect(() => {
    const b = orgBaseStats[orgId] || orgBaseStats["acme-corp"];
    setStats({ ...b });
    setLastUpdated(new Date());
  }, [orgId]);

  const simulateUpdate = useCallback(() => {
    setStats((current) => ({
      ...current,
      activeProxies: current.activeProxies + Math.floor(Math.random() * 20) - 10,
      successRate: Math.min(100, Math.max(95, current.successRate + (Math.random() - 0.5) * 0.2)),
      avgLatency: Math.max(35, Math.min(300, current.avgLatency + Math.floor(Math.random() * 4) - 2)),
    }));
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(simulateUpdate, interval);
    return () => clearInterval(intervalId);
  }, [interval, enabled, simulateUpdate]);

  return { stats, lastUpdated };
};

const orgBandwidthScale: Record<string, number> = {
  "acme-corp": 1,
  "zenith-data": 0.4,
  "nova-systems": 0.08,
};

export const useRealTimeBandwidthData = (interval = 2000, enabled = true, orgId = "acme-corp") => {
  const scale = orgBandwidthScale[orgId] || 1;
  const [data, setData] = useState(() => [
    { time: "00:00", used: Math.round(120 * scale) },
    { time: "04:00", used: Math.round(80 * scale) },
    { time: "08:00", used: Math.round(200 * scale) },
    { time: "12:00", used: Math.round(350 * scale) },
    { time: "16:00", used: Math.round(420 * scale) },
    { time: "20:00", used: Math.round(380 * scale) },
    { time: "Now", used: Math.round(290 * scale) },
  ]);

  // Reset when org changes
  useEffect(() => {
    const s = orgBandwidthScale[orgId] || 1;
    setData([
      { time: "00:00", used: Math.round(120 * s) },
      { time: "04:00", used: Math.round(80 * s) },
      { time: "08:00", used: Math.round(200 * s) },
      { time: "12:00", used: Math.round(350 * s) },
      { time: "16:00", used: Math.round(420 * s) },
      { time: "20:00", used: Math.round(380 * s) },
      { time: "Now", used: Math.round(290 * s) },
    ]);
  }, [orgId]);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      setData((current) => {
        const newData = [...current];
        for (let i = 0; i < newData.length - 1; i++) {
          newData[i].used = newData[i + 1].used;
        }
        const lastValue = newData[newData.length - 2].used;
        const maxVal = Math.round(500 * scale);
        const change = Math.floor(Math.random() * Math.round(60 * scale)) - Math.round(30 * scale);
        newData[newData.length - 1].used = Math.max(Math.round(50 * scale), Math.min(maxVal, lastValue + change));
        return newData;
      });
    }, interval);

    return () => clearInterval(intervalId);
  }, [interval, enabled, scale]);

  return data;
};
