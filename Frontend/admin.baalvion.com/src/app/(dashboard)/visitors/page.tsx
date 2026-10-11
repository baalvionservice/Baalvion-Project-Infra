'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Globe, Monitor, Smartphone, Tablet, Eye, LogIn,
  Wifi, RefreshCw, Clock, MapPin, Chrome, Shield,
  AlertTriangle, Activity, Filter, Download,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealtimeStore } from '@/lib/store/realtimeStore';
import { cn } from '@/lib/utils/cn';
import type { LiveEvent } from '@/lib/types/realtime.types';

/* ─── Types ─────────────────────────────────────────────────────── */
interface Visitor {
  id: string;
  session_id: string;
  ip: string;
  real_ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  isp: string;
  browser: string;
  browser_version: string;
  os: string;
  device_type: 'Mobile' | 'Desktop' | 'Tablet' | string;
  screen_width: number | null;
  screen_height: number | null;
  language: string;
  referrer: string;
  landing_path: string;
  entered_site: boolean;
  entered_at: string | null;
  created_at: string;
}

const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:9002';

/* ─── Helpers ───────────────────────────────────────────────────── */
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function DeviceIcon({ type }: { type: string }) {
  if (type === 'Mobile')  return <Smartphone className="w-3.5 h-3.5" />;
  if (type === 'Tablet')  return <Tablet className="w-3.5 h-3.5" />;
  return <Monitor className="w-3.5 h-3.5" />;
}

function FlagEmoji({ code }: { code: string }) {
  if (!code || code.length !== 2) return <Globe className="w-3.5 h-3.5 text-gray-500" />;
  const flag = code.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
  return <span className="text-base leading-none">{flag}</span>;
}

/* ─── Live visitor row from WS ─────────────────────────────────── */
function LiveVisitorPill({ event }: { event: LiveEvent }) {
  const meta = event.meta as Record<string, unknown> | undefined;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-orange-500/20 bg-orange-500/5">
      <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
      <DeviceIcon type={String(meta?.deviceType || 'Desktop')} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{event.summary}</div>
        <div className="text-[11px] text-gray-500 truncate">
          {String(meta?.browser || '')} · {String(meta?.os || '')} · {String(meta?.screen || '')}
        </div>
      </div>
      <div className="text-[11px] text-gray-600 flex-shrink-0">{timeAgo(event.timestamp)}</div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'entered'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live events from the WebSocket store
  const allEvents  = useRealtimeStore(s => s.events);
  const liveVisitors = allEvents
    .filter(e => e.type === 'visitor')
    .slice(0, 20);

  /* ── Fetch DB visitors ── */
  const fetchVisitors = async () => {
    try {
      const q = filter === 'entered' ? '&entered=true' : '';
      const res = await fetch(`${ADMIN_API}/v1/track/visitors?limit=200${q}`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setVisitors(data.data?.visitors || []);
      setTotal(data.data?.total || 0);
    } catch {/* network down */} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!autoRefresh) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(fetchVisitors, 15_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, filter]);

  /* ── Stats ── */
  const desktops = visitors.filter(v => v.device_type === 'Desktop').length;
  const mobiles  = visitors.filter(v => v.device_type === 'Mobile').length;
  const entered  = visitors.filter(v => v.entered_site).length;

  const topCountries = Object.entries(
    visitors.reduce<Record<string, number>>((acc, v) => {
      if (v.country) acc[v.country] = (acc[v.country] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  /* ── Export ── */
  const handleExport = () => {
    const rows = [
      ['Time', 'IP', 'Country', 'City', 'ISP', 'Browser', 'OS', 'Device', 'Screen', 'Language', 'Referrer', 'Path', 'Entered'],
      ...visitors.map(v => [
        v.created_at, v.real_ip || v.ip, v.country, v.city, v.isp,
        `${v.browser} ${v.browser_version}`, v.os, v.device_type,
        v.screen_width ? `${v.screen_width}x${v.screen_height}` : '',
        v.language, v.referrer, v.landing_path, v.entered_site ? 'Yes' : 'No',
      ])
    ].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `visitors_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Site Visitors"
        description="Real-time intelligence on every person who visits the site"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm" variant="outline"
              onClick={() => setAutoRefresh(r => !r)}
              className={cn(autoRefresh && 'border-green-500/40 text-green-400')}
            >
              <Activity className="w-3.5 h-3.5 mr-1.5" />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>
            <Button size="sm" variant="outline" onClick={fetchVisitors}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
          </div>
        }
      />

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Visitors',    value: total,    icon: Eye,        color: 'text-blue-400' },
          { label: 'Entered Site',      value: entered,  icon: LogIn,      color: 'text-green-400' },
          { label: 'Desktop',           value: desktops, icon: Monitor,    color: 'text-purple-400' },
          { label: 'Mobile',            value: mobiles,  icon: Smartphone, color: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-[#111318] border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('w-4 h-4', color)} />
                <span className="text-[11px] text-gray-500 uppercase tracking-widest">{label}</span>
              </div>
              <div className="text-2xl font-black text-white">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Live feed (WebSocket) ── */}
        <div className="lg:col-span-1 space-y-3">
          <Card className="bg-[#111318] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Live Activity
                <span className="ml-auto text-[10px] text-gray-600 font-normal">{liveVisitors.length} recent</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
              {liveVisitors.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-6">Waiting for visitors...</p>
              ) : (
                liveVisitors.map(ev => <LiveVisitorPill key={ev.id} event={ev} />)
              )}
            </CardContent>
          </Card>

          {/* Top countries */}
          <Card className="bg-[#111318] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Top Countries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topCountries.map(([country, count]) => (
                <div key={country} className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-300 flex-1 truncate">{country}</span>
                  <span className="text-xs font-bold text-white">{count}</span>
                </div>
              ))}
              {topCountries.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-4">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Full visitor table ── */}
        <div className="lg:col-span-2">
          <Card className="bg-[#111318] border-white/5">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm">
                Visitor Log
                <span className="ml-2 text-gray-600 font-normal text-[11px]">{total} total</span>
              </CardTitle>
              <div className="flex gap-2">
                {(['all', 'entered'] as const).map(f => (
                  <Button
                    key={f}
                    size="sm" variant={filter === f ? 'default' : 'outline'}
                    className="h-7 text-[11px] px-3"
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all' ? 'All' : 'Entered Only'}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#111318] border-b border-white/5">
                    <tr className="text-gray-500 uppercase tracking-wider">
                      {['Time', 'IP / Location', 'Device & Browser', 'Screen', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/3">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 5 }).map((_, j) => (
                            <td key={j} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>
                          ))}
                        </tr>
                      ))
                    ) : visitors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-600">
                          No visitor data yet. Waiting for real visitors…
                        </td>
                      </tr>
                    ) : visitors.map(v => (
                      <tr key={v.id} className="hover:bg-white/2 transition-colors">
                        {/* Time */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            {timeAgo(v.created_at)}
                          </div>
                        </td>

                        {/* IP / Location */}
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <FlagEmoji code={v.country_code} />
                            <span className="font-mono text-[11px] text-gray-300">{v.real_ip || v.ip}</span>
                          </div>
                          <div className="text-gray-600 text-[10px] truncate max-w-[150px]">
                            {[v.city, v.region, v.country].filter(Boolean).join(', ')}
                          </div>
                          {v.isp && (
                            <div className="text-gray-700 text-[10px] truncate max-w-[150px] mt-0.5">
                              {v.isp}
                            </div>
                          )}
                        </td>

                        {/* Device & Browser */}
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex items-center gap-1.5 text-gray-300 mb-0.5">
                            <DeviceIcon type={v.device_type} />
                            <span>{v.device_type}</span>
                          </div>
                          <div className="text-gray-600 text-[10px]">
                            {v.browser} {v.browser_version}
                          </div>
                          <div className="text-gray-700 text-[10px]">{v.os}</div>
                          {v.language && (
                            <div className="text-gray-700 text-[10px]">🌐 {v.language}</div>
                          )}
                        </td>

                        {/* Screen */}
                        <td className="px-4 py-3 whitespace-nowrap text-gray-500 font-mono text-[10px]">
                          {v.screen_width ? `${v.screen_width}×${v.screen_height}` : '—'}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {v.entered_site ? (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                              <LogIn className="w-2.5 h-2.5 mr-1" />
                              Entered
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600 text-[10px]">
                              <Eye className="w-2.5 h-2.5 mr-1" />
                              Viewed
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
