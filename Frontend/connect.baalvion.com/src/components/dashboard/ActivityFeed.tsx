'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Wallet,
  Target,
  UserCheck,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Smartphone,
  ChevronRight,
  ArrowRight,
  Activity,
  History,
  Loader2
} from 'lucide-react';
import {
  isToday,
  isYesterday,
  isThisWeek,
  parseISO,
  format
} from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/use-realtime-data';
import { Notification, NotificationType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ActivityFeedProps {
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({ className, maxItems = 15 }: ActivityFeedProps) {
  const { currentUser } = useAuth();
  const { data: rawNotifications, loading } = useNotifications(currentUser?.id);

  // Group notifications by date
  const groupedActivities = useMemo(() => {
    if (!rawNotifications) return { today: [], yesterday: [], earlier: [] };

    const sorted = [...rawNotifications]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, maxItems);

    return sorted.reduce((acc: any, curr) => {
      const date = parseISO(curr.createdAt);
      if (isToday(date)) {
        acc.today.push(curr);
      } else if (isYesterday(date)) {
        acc.yesterday.push(curr);
      } else {
        acc.earlier.push(curr);
      }
      return acc;
    }, { today: [], yesterday: [], earlier: [] });
  }, [rawNotifications, maxItems]);

  const getActivityIcon = (type: NotificationType) => {
    switch (type) {
      case 'PROFILE_VIEW': return { icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50' };
      case 'NEW_MATCH': return { icon: Target, color: 'text-primary', bg: 'bg-primary/5' };
      case 'PAYMENT_RECEIVED': return { icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' };
      case 'APPLICATION_UPDATE': return { icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' };
      case 'CAMPAIGN_INVITE': return { icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'SYSTEM': return { icon: AlertCircle, color: 'text-slate-500', bg: 'bg-slate-100' };
      case 'NEW_MESSAGE': return { icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50' };
      default: return { icon: Activity, color: 'text-slate-400', bg: 'bg-slate-50' };
    }
  };

  if (loading) {
    return (
      <Card className={cn("border-none shadow-sm rounded-3xl overflow-hidden bg-white", className)}>
        <CardHeader className="border-b bg-slate-50/50 p-6">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Marketplace Pulse
          </CardTitle>
        </CardHeader>
        <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Feed...</p>
        </CardContent>
      </Card>
    );
  }

  const hasActivity = groupedActivities.today.length > 0 ||
    groupedActivities.yesterday.length > 0 ||
    groupedActivities.earlier.length > 0;

  return (
    <Card className={cn("border-none shadow-sm rounded-[2rem] overflow-hidden bg-white h-full flex flex-col", className)}>
      <CardHeader className="border-b bg-slate-50/50 p-6 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary fill-primary/20" />
            Activity Stream
          </CardTitle>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Real-time collaboration logs</p>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-y-auto scrollbar-hide">
        {!hasActivity ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center">
              <Activity className="h-8 w-8 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">Quiet for now...</p>
              <p className="text-xs text-slate-400">Apply to more campaigns or update your profile to trigger activity.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {/* Today Group */}
            {groupedActivities.today.length > 0 && (
              <ActivityGroup label="Today" items={groupedActivities.today} getIcon={getActivityIcon} />
            )}

            {/* Yesterday Group */}
            {groupedActivities.yesterday.length > 0 && (
              <ActivityGroup label="Yesterday" items={groupedActivities.yesterday} getIcon={getActivityIcon} />
            )}

            {/* Earlier Group */}
            {groupedActivities.earlier.length > 0 && (
              <ActivityGroup label="This Week" items={groupedActivities.earlier} getIcon={getActivityIcon} />
            )}
          </div>
        )}
      </CardContent>

      {hasActivity && (
        <div className="p-4 bg-slate-50/30 border-t flex justify-center">
          <Link href="/dashboard/notifications" className="w-full">
            <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-primary group">
              View Audit History <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

function ActivityGroup({ label, items, getIcon }: {
  label: string,
  items: Notification[],
  getIcon: (type: NotificationType) => { icon: any, color: string, bg: string }
}) {
  return (
    <div className="space-y-0">
      <div className="px-6 py-3 bg-slate-50/50 border-b border-t first:border-t-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      </div>
      {items.map((item, idx) => {
        const config = getIcon(item.type);
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-all group"
          >
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white transition-transform group-hover:scale-110",
              config.bg,
              config.color
            )}>
              <config.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-xs font-black text-slate-900 uppercase truncate pr-4">{item.title}</p>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">
                  {format(parseISO(item.createdAt), 'h:mm a')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                {item.message}
              </p>
              {item.link && (
                <Link href={item.link} className="inline-flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest mt-2 hover:underline">
                  Action Required <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
