'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile } from '@/services/user/userService';
import { getLawyerCases } from '@/services/caseService';
import { getLawyerBookings } from '@/services/bookingService';
import { subscribeToNotifications } from '@/services/notifications/notificationService';
import { getDocumentsByCase } from '@/services/documents/documentService';
import { subscribeToMessages, getUnreadMessageCount } from '@/services/chat/chatService';
import { getMyLawyerProfile } from '@/services/lawyers/lawyerService';

// Profile-completion is a real, derived metric from the wizard's own fields —
// never a fabricated percentage. Weighted evenly across the fields a public
// profile actually uses.
const PROFILE_FIELDS: { key: string; check: (p: any) => boolean }[] = [
  { key: 'bio', check: (p) => !!p?.bio },
  { key: 'licenseNumber', check: (p) => !!p?.licenseNumber },
  { key: 'experience', check: (p) => !!p?.experience },
  { key: 'practiceAreas', check: (p) => Array.isArray(p?.practiceAreas) && p.practiceAreas.length > 0 },
  { key: 'languages', check: (p) => Array.isArray(p?.languages) && p.languages.length > 0 },
  { key: 'location', check: (p) => !!(p?.state && p?.cityRef) },
  { key: 'profileImage', check: (p) => !!p?.hasProfilePhoto },
  { key: 'verified', check: (p) => !!p?.isVerified },
];

function computeProfileCompletion(lawyerProfile: any): number {
  if (!lawyerProfile) return 0;
  const done = PROFILE_FIELDS.filter((f) => f.check(lawyerProfile)).length;
  return Math.round((done / PROFILE_FIELDS.length) * 100);
}

/**
 * @fileOverview useLawyerDashboardData Hook
 * Aggregates all platform intelligence for practitioners into a single reactive ledger.
 */
export function useLawyerDashboardData(userId: string | undefined) {
  const [data, setData] = useState<any>({
    profile: null,
    lawyerProfile: null,
    cases: [],
    appointments: [],
    messages: [],
    notifications: [],
    recentDocuments: [],
    activities: [],
    unreadMessages: 0,
    profileCompletion: 0,
    referralRequests: 0,
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      // 1. Parallel Fetch for base practitioner data
      const [profile, cases, appointments, lawyerProfile, unreadMessages] = await Promise.all([
        getUserProfile(userId),
        getLawyerCases(userId),
        getLawyerBookings(userId),
        getMyLawyerProfile(),
        getUnreadMessageCount(),
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
        lawyerProfile,
        cases,
        appointments,
        recentDocuments: allDocs.slice(0, 5),
        earnings: {
          total: totalEarnings,
          completed: appointments.filter((a: any) => a.status === 'completed').length
        },
        unreadMessages,
        profileCompletion: computeProfileCompletion(lawyerProfile),
        // Wired forward-compatibly: populated once Phase 4 (case-referral
        // routing) ships its own endpoint; 0 until then, never fabricated.
        referralRequests: 0,
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
    unreadNotifs: data.notifications.filter((n: any) => !n.isRead).length,
    unreadMessages: data.unreadMessages ?? 0,
    profileCompletion: data.profileCompletion ?? 0,
    referralRequests: data.referralRequests ?? 0,
  };

  return { 
    ...data, 
    stats,
    refresh: fetchData 
  };
}
