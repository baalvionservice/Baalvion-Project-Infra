'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  AlertCircle,
  Zap,
  CheckCircle2,
  X,
  ArrowRight,
  MessageSquare,
  Wallet,
  Calendar,
  Briefcase,
  ShieldAlert,
  Loader2,
  TrendingUp
} from 'lucide-react';
import {
  collection,
  query,
  where,
  doc,
  setDoc,
  getDocs,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useFirestore, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { differenceInHours, parseISO } from 'date-fns';

interface ReminderItem {
  id: string;
  type: 'DEADLINE' | 'APPLICATION' | 'MESSAGE' | 'PAYOUT';
  severity: 'URGENT' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  link?: string;
  icon: any;
}

export function DeadlineReminders() {
  const { currentUser } = useAuth();
  const db = useFirestore();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loadingDismissed, setLoadingDismissed] = useState(true);

  // 1. Fetch relevant data for checks
  const { data: campaigns } = useCollection<any>(
    db
      ? currentUser?.role === 'BRAND'
        ? query(collection(db, 'campaigns'), where('brandId', '==', `brand_${currentUser.id}`))
        : query(collection(db, 'campaigns'), where('status', '==', 'ACTIVE'))
      : null
  );

  const { data: applications } = useCollection<any>(
    db
      ? currentUser?.role === 'BRAND'
        ? query(collection(db, 'applications'), where('status', '==', 'PENDING'))
        : query(collection(db, 'applications'), where('creatorId', '==', currentUser?.id || ''))
      : null
  );

  const { data: conversations } = useCollection<any>(
    db && currentUser?.id ? query(collection(db, 'conversations'), where('participantIds', 'array-contains', currentUser.id)) : null
  );

  // 2. Fetch dismissed state from Firestore
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchDismissed = async () => {
      try {
        const snap = await getDocs(collection(db!, 'users', currentUser.id, 'dismissed_reminders'));
        const ids = new Set(snap.docs.map(doc => doc.id));
        setDismissedIds(ids);
      } catch (e) {
        console.error("Failed to fetch dismissed reminders", e);
      } finally {
        setLoadingDismissed(false);
      }
    };

    fetchDismissed();
  }, [db!, currentUser?.id]);

  // 3. Reminder Generation Logic
  const activeReminders = useMemo(() => {
    if (loadingDismissed || !currentUser) return [];

    const list: ReminderItem[] = [];

    // --- DEADLINE CHECKS ---
    campaigns.forEach(c => {
      if (c.status !== 'ACTIVE' && c.status !== 'PENDING_REVIEW') return;

      const deadline = parseISO(c.endDate);
      const hoursLeft = differenceInHours(deadline, new Date());

      if (hoursLeft > 0 && hoursLeft <= 48) {
        const severity = hoursLeft <= 6 ? 'URGENT' : hoursLeft <= 24 ? 'WARNING' : 'INFO';
        list.push({
          id: `deadline_${c.id}_${severity}`,
          type: 'DEADLINE',
          severity,
          title: severity === 'URGENT' ? 'Deadline Critical' : 'Upcoming Deadline',
          message: `Campaign "${c.title}" ends in ${hoursLeft} hours. Finalize review now.`,
          link: `/dashboard/${currentUser.role.toLowerCase()}/campaigns/${c.id}`,
          icon: Clock
        });
      }
    });

    // --- APPLICATION CHECKS (Brand Side) ---
    if (currentUser.role === 'BRAND' && applications.length > 0) {
      list.push({
        id: `pending_apps_brand`,
        type: 'APPLICATION',
        severity: 'INFO',
        title: 'Review Applicants',
        message: `You have ${applications.length} pending creator applications awaiting your decision.`,
        link: `/dashboard/brand/campaigns`,
        icon: Briefcase
      });
    }

    // --- MESSAGE CHECKS ---
    const unreadChats = conversations.filter(c => (c.unreadCounts?.[currentUser.id] || 0) > 0);
    if (unreadChats.length > 0) {
      list.push({
        id: `unread_msgs`,
        type: 'MESSAGE',
        severity: 'WARNING',
        title: 'Unread Messages',
        message: `You have new messages in ${unreadChats.length} collaboration threads.`,
        link: `/dashboard/${currentUser.role.toLowerCase()}/messages`,
        icon: MessageSquare
      });
    }

    // --- PAYOUT CHECKS (Creator Side) ---
    if (currentUser.role === 'CREATOR') {
      // Mock condition: wallet balance over 10k
      const hasHighBalance = true; // Simulating from currentUser or wallet hook
      if (hasHighBalance) {
        list.push({
          id: `payout_ready`,
          type: 'PAYOUT',
          severity: 'INFO',
          title: 'Earnings Ready',
          message: 'Your available balance is over ₹10,000. Request a payout now.',
          link: `/dashboard/creator/wallet`,
          icon: Wallet
        });
      }
    }

    return list.filter(r => !dismissedIds.has(r.id));
  }, [campaigns, applications, conversations, currentUser, dismissedIds, loadingDismissed]);

  const handleDismiss = async (reminderId: string) => {
    if (!currentUser?.id) return;

    // Local update
    setDismissedIds(prev => new Set([...prev, reminderId]));

    // Firestore update
    try {
      await setDoc(doc(db!, 'users', currentUser.id, 'dismissed_reminders', reminderId), {
        dismissedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() // 24h cooldown
      });
    } catch (e) {
      console.error("Failed to persist dismissal", e);
    }
  };

  if (activeReminders.length === 0) return null;

  return (
    <div className="space-y-4 mb-10">
      <AnimatePresence mode="popLayout">
        {activeReminders.map((reminder, idx) => (
          <motion.div
            key={reminder.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            layout
          >
            <Card className={cn(
              "border-none shadow-lg overflow-hidden group",
              reminder.severity === 'URGENT' ? "bg-red-50 ring-2 ring-red-200" :
                reminder.severity === 'WARNING' ? "bg-orange-50 ring-1 ring-orange-100" :
                  "bg-white ring-1 ring-slate-100"
            )}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-center">
                  {/* Left: Icon & Title */}
                  <div className="flex-1 p-5 flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                      reminder.severity === 'URGENT' ? "bg-white text-red-600 animate-pulse" :
                        reminder.severity === 'WARNING' ? "bg-white text-orange-600" :
                          "bg-primary/5 text-primary"
                    )}>
                      <reminder.icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={cn(
                          "font-black text-sm uppercase tracking-tight",
                          reminder.severity === 'URGENT' ? "text-red-900" : "text-slate-900"
                        )}>{reminder.title}</h4>
                        <Badge className={cn(
                          "text-[8px] font-black uppercase border-none px-1.5 h-4",
                          reminder.severity === 'URGENT' ? "bg-red-600 text-white" :
                            reminder.severity === 'WARNING' ? "bg-orange-200 text-orange-700" :
                              "bg-slate-100 text-slate-500"
                        )}>
                          {reminder.severity}
                        </Badge>
                      </div>
                      <p className={cn(
                        "text-xs font-medium leading-relaxed truncate max-w-md",
                        reminder.severity === 'URGENT' ? "text-red-700" : "text-slate-500"
                      )}>{reminder.message}</p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="p-5 flex items-center gap-3 bg-black/5 sm:bg-transparent w-full sm:w-auto justify-end border-t sm:border-t-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl font-bold text-xs text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 px-4"
                      onClick={() => handleDismiss(reminder.id)}
                    >
                      Dismiss
                    </Button>
                    {reminder.link && (
                      <Link href={reminder.link} className="flex-1 sm:flex-none">
                        <Button
                          size="sm"
                          className={cn(
                            "w-full sm:w-auto rounded-xl font-black h-10 px-6 shadow-sm group/btn",
                            reminder.severity === 'URGENT' ? "bg-red-600 hover:bg-red-700" :
                              reminder.severity === 'WARNING' ? "bg-orange-500 hover:bg-orange-600" :
                                "bg-slate-900 hover:bg-slate-800"
                          )}
                        >
                          Take Action
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
