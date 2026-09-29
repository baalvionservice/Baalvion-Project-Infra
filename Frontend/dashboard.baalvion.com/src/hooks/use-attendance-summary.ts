"use client";
// Aggregated attendance views (overview / businessAttendance / weeklyCalendar / productivity)
// from the live dashboardApi.attendanceSummary() endpoint (derived from real attendance + employees).
import { useEffect, useState } from "react";
import { dashboardApi } from "@/lib/api-client";

export interface AttendanceOverview {
  attendanceRate: number;
  totalEmployees: number;
  present: number;
  onTime: number;
  late: number;
  absent: number;
}
export interface BusinessAttendance { businessId: string; name: string; rate: number }
export interface WeeklyRow { employeeId: string; week: string[] }
export interface LeaderboardRow { employeeId: string; score: number; tasks: number }
export interface Productivity {
  tasksCompleted: number;
  tasksTarget: number;
  avgResponseTime: string;
  meetingsThisWeek: number;
  leaderboard: LeaderboardRow[];
}
export interface AttendanceSummary {
  overview: AttendanceOverview;
  businessAttendance: BusinessAttendance[];
  weeklyCalendar: WeeklyRow[];
  productivity: Productivity;
}

const EMPTY: AttendanceSummary = {
  overview: { attendanceRate: 0, totalEmployees: 0, present: 0, onTime: 0, late: 0, absent: 0 },
  businessAttendance: [],
  weeklyCalendar: [],
  productivity: { tasksCompleted: 0, tasksTarget: 0, avgResponseTime: "—", meetingsThisWeek: 0, leaderboard: [] },
};

export function useAttendanceSummary() {
  const [data, setData] = useState<AttendanceSummary>(EMPTY);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await dashboardApi.attendanceSummary();
        const obj = ((d as { data?: unknown })?.data ?? d) as Partial<AttendanceSummary>;
        if (!cancelled && obj) {
          setData({
            overview: { ...EMPTY.overview, ...(obj.overview ?? {}) },
            businessAttendance: obj.businessAttendance ?? [],
            weeklyCalendar: obj.weeklyCalendar ?? [],
            productivity: { ...EMPTY.productivity, ...(obj.productivity ?? {}) },
          });
        }
      } catch { /* leave empty */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return { ...data, loading };
}
