'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '@/services/user/userService';
import { getLawyerCases } from '@/services/caseService';
import { getLawyerBookings } from '@/services/bookingService';
import { subscribeToNotifications } from '@/services/notifications/notificationService';
import { getDocumentsByCase } from '@/services/documents/documentService';
import { subscribeToMessages } from '@/services/chat/chatService';

/**
 * @fileOverview useLawyerDashboardData Hook
 * Aggregates all platform intelligence for practitioners into a single reactive ledger.
 */
export function useLawyerDashboardData(userId: string | undefined) {
  const [data, setData] = useState<any>({
    profile: null,
    cases: [],
    appointments: [],
    messages: [],
    notifications: [],
    recentDocuments: [],
    activities: [],
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      // 1. Parallel Fetch for base practitioner data
      const [profile, cases, appointments] = await Promise.all([
        getUserProfile(userId),
        getLawyerCases(userId),
        getLawyerBookings(userId)
      ]);

      // 2. Aggregate documents and messages from all assigned cases
      let allDocs: any[] = [];
      const activeCases = cases.filter((c: any) => c.status === 'active' || c.status === 'in_progress');
      
      if (activeCases.length > 0) {
        const docPromises = activeCases.slice(0, 3).map((c: any) => getDocumentsByCase(c.id || c.caseId));
        const docResults = await Promise.all(docPromises);
        allDocs = docResults.flat().sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }

      // Mock earnings logic for dashboard fidelity
      const totalEarnings = appointments
        .filter((a: any) => a.status === 'confirmed' || a.status === 'completed')
        .length * 5000;

      setData((prev: any) => ({
        ...prev,
        profile,
        cases,
        appointments,
        recentDocuments: allDocs.slice(0, 5),
        earnings: {
          total: totalEarnings,
          completed: appointments.filter((a: any) => a.status === 'completed').length
        },
        loading: false
      }));
    } catch (err: any) {
      console.error("Practitioner dashboard aggregation failure:", err);
      setData((prev: any) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchData();
      
      // 3. Real-time Subscription for Alerts
      const unsubNotifications = subscribeToNotifications(userId, (notifications) => {
        setData((prev: any) => ({ ...prev, notifications }));
      });

      return () => {
        if (unsubNotifications) unsubNotifications();
      };
    }
  }, [userId, fetchData]);

  // Derived Statistics for Dashboard Metrics
  const stats = {
    totalCases: data.cases.length,
    activeCases: data.cases.filter((c: any) => c.status === 'active' || c.status === 'in_progress').length,
    todayApts: data.appointments.filter((a: any) => {
      const aptDate = new Date(a.date).toDateString();
      const today = new Date().toDateString();
      return aptDate === today && a.status === 'confirmed';
    }).length,
    unreadNotifs: data.notifications.filter((n: any) => !n.isRead).length
  };

  return { 
    ...data, 
    stats,
    refresh: fetchData 
  };
}
