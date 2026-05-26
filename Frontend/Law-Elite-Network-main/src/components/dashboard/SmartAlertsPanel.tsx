"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Bell, Clock, FileWarning, ShieldCheck } from 'lucide-react';

interface SmartAlertsPanelProps {
  cases: any[];
  appointments: any[];
  notifications: any[];
}

/**
 * @fileOverview SmartAlertsPanel
 * Surfaces real-time intelligence signals derived from member data.
 */
export default function SmartAlertsPanel({ cases, appointments, notifications }: SmartAlertsPanelProps) {
  const alerts = [];

  // 1. Derive Document Alerts
  const caseNeedingDocs = cases.find(c => (!c.documents || c.documents.length === 0));
  if (caseNeedingDocs) {
    alerts.push({
      id: 'alert-docs',
      type: 'warning',
      icon: <FileWarning className="w-4 h-4 text-amber-500" />,
      message: `Matter "${caseNeedingDocs.title}" missing records.`
    });
  }

  // 2. Derive Appointment Alerts
  const soonApt = appointments.find(a => {
    const aptDate = new Date(a.date);
    const diff = aptDate.getTime() - Date.now();
    return diff > 0 && diff < (48 * 60 * 60 * 1000); // within 48 hours
  });
  if (soonApt) {
    alerts.push({
      id: 'alert-apt',
      type: 'info',
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      message: `Consultation session in 48 hours.`
    });
  }

  // 3. Derive Notification Alerts
  const unreadCount = notifications.filter(n => !n.isRead).length;
  if (unreadCount > 0) {
    alerts.push({
      id: 'alert-notif',
      type: 'signal',
      icon: <Bell className="w-4 h-4 text-blue-600" />,
      message: `${unreadCount} unread network signals.`
    });
  }

  return (
    <Card className="border-slate-200 bg-white shadow-sm h-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
        <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5" /> Intelligence Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                <div className="mt-0.5">{alert.icon}</div>
                <p className="text-[11px] font-bold text-slate-700 leading-tight">
                  {alert.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center space-y-2 opacity-60">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-[10px] font-bold uppercase text-slate-400">All Protocols Clear</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
