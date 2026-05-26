'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '@/services/user/userService';
import { getCasesByClient } from '@/services/cases/caseService';
import { getAppointmentsByClient } from '@/services/appointments/appointmentService';
import { generateRecommendations } from '@/services/recommendations/recommendationService';
import { subscribeToNotifications } from '@/services/notifications/notificationService';
import { getDocumentsByCase } from '@/services/documents/documentService';
import { subscribeToMessages } from '@/services/chat/chatService';

/**
 * @fileOverview useDashboardData Hook
 * Aggregates all platform intelligence into a single reactive ledger.
 */
export function useDashboardData(userId: string | undefined) {
  const [data, setData] = useState<any>({
    profile: null,
    cases: [],
    appointments: [],
    recommendations: [],
    notifications: [],
    recentDocuments: [],
    unreadMessagesCount: 0,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      // 1. Parallel Fetch for base data
      const [profile, cases, appointments, recommendations] = await Promise.all([
        getUserProfile(userId),
        getCasesByClient(userId),
        getAppointmentsByClient(userId),
        generateRecommendations(userId)
      ]);

      // 2. Aggregate documents from all active cases
      let allDocs: any[] = [];
      const activeCases = cases.filter((c: any) => c.status === 'active' || c.status === 'in_progress');
      
      if (activeCases.length > 0) {
        const docPromises = activeCases.slice(0, 3).map((c: any) => getDocumentsByCase(c.id || c.caseId));
        const docResults = await Promise.all(docPromises);
        allDocs = docResults.flat().sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      }

      setData(prev => ({
        ...prev,
        profile,
        cases,
        appointments,
        recommendations,
        recentDocuments: allDocs.slice(0, 5),
        loading: false
      }));
    } catch (err: any) {
      console.error("Dashboard aggregation failure:", err);
      setData(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchData();
      
      // 3. Real-time Subscription for Notifications
      const unsubNotifications = subscribeToNotifications(userId, (notifications) => {
        setData(prev => ({ ...prev, notifications }));
      });

      return () => {
        if (unsubNotifications) unsubNotifications();
      };
    }
  }, [userId, fetchData]);

  return { 
    ...data, 
    refresh: fetchData,
    stats: {
      totalCases: data.cases.length,
      activeCases: data.cases.filter((c: any) => c.status === 'active' || c.status === 'in_progress').length,
      upcomingApts: data.appointments.filter((a: any) => a.status === 'confirmed').length,
      unreadNotifs: data.notifications.filter((n: any) => !n.isRead).length
    }
  };
}
