'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';

/**
 * @fileOverview useAdminDashboardData Hook
 * Aggregates global platform intelligence for authorized administrators.
 * Orchestrates a unified synchronization ledger for Users, Cases, Bookings, and Logs.
 */
export function useAdminDashboardData() {
  const { adminController, role } = useAuthContext();
  const [data, setData] = useState<any>({
    users: [],
    cases: [],
    bookings: [],
    auditLogs: [],
    stats: {
      totalUsers: 0,
      totalLawyers: 0,
      totalCases: 0,
      activeCases: 0,
      totalBookings: 0,
      revenue: 0
    },
    loading: true,
    error: null
  });

  const fetchData = useCallback(async () => {
    if (role !== 'admin' || !adminController) {
      setData((prev: any) => ({ ...prev, loading: false }));
      return;
    }

    try {
      // 1. Execute Parallel Platform Audit
      const [
        usersRes,
        casesRes,
        bookingsRes,
        statsRes,
        logsRes
      ] = await Promise.all([
        adminController.getUsers({ isAdmin: true }),
        adminController.getCases({ isAdmin: true }),
        adminController.getBookings({ isAdmin: true }),
        adminController.getStats({ isAdmin: true }),
        adminController.getLogs({ isAdmin: true })
      ]);

      // 2. Synthesize Intelligence Ledger
      setData({
        users: usersRes.data || [],
        cases: casesRes.data || [],
        bookings: bookingsRes.data || [],
        auditLogs: logsRes.data || [],
        stats: {
          totalUsers: usersRes.data?.length || 0,
          totalLawyers: usersRes.data?.filter((u: any) => u.roleId === 'lawyer').length || 0,
          totalCases: casesRes.data?.length || 0,
          activeCases: casesRes.data?.filter((c: any) => c.status === 'active').length || 0,
          totalBookings: bookingsRes.data?.length || 0,
          revenue: statsRes.data?.totalRevenue || 0
        },
        loading: false,
        error: null
      });
    } catch (err: any) {
      console.error("Admin Command sync failure:", err);
      setData((prev: any) => ({ ...prev, loading: false, error: err.message }));
    }
  }, [adminController, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...data, refresh: fetchData };
}
