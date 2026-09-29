"use client";

import React, { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getUserNotifications } from "@/services/notificationService";
import { useAuthStore } from "@/store/authStore";
import NotificationList from "@/components/notifications/NotificationList";
import { ShieldCheck, Loader2, Inbox } from "lucide-react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <DashboardShell>
        <NotificationsContent />
      </DashboardShell>
    </ProtectedRoute>
  );
}

function NotificationsContent() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    if (user) {
      const data = await getUserNotifications(user.id);
      setNotifications(data);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <div className="container mx-auto px-8 pt-8 pb-12 animate-in fade-in duration-700">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-2">
              <ShieldCheck className="w-3 h-3" />
              Intelligence Ledger
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 leading-tight">Network Alerts</h1>
          <p className="text-slate-500 text-sm font-medium italic mt-2">Audit historical system notifications and executive status updates.</p>
        </header>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 opacity-20" />
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {notifications.length > 0 ? (
              <NotificationList notifications={notifications} onUpdate={load} />
            ) : (
              <div className="py-32 text-center flex flex-col items-center gap-4">
                <Inbox className="w-16 h-16 text-slate-100 mx-auto mb-2" />
                <h3 className="text-2xl font-bold text-slate-900">Ledger Empty</h3>
                <p className="text-slate-500 max-w-xs mx-auto italic text-sm font-medium">
                  No executive alerts have been broadcasted to your profile yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
