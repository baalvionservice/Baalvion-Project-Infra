/**
 * @fileOverview AnalyticsService (Advanced)
 * Computes deep intelligence metrics for platform-wide strategic auditing.
 */

import { getAllUsersMock } from "@/lib/mock/adminMock";

/**
 * Aggregates high-fidelity metrics from the platform's distributed mock ledgers.
 */
export const getAdvancedAnalytics = async () => {
  // Simulate intelligence synchronization protocol
  await new Promise(resolve => setTimeout(resolve, 1000));

  const users = getAllUsersMock();
  const bookingsStr = typeof window !== 'undefined' ? localStorage.getItem("law_elite_bookings") : null;
  const paymentsStr = typeof window !== 'undefined' ? localStorage.getItem("law_elite_payments") : null;

  const bookings = bookingsStr ? JSON.parse(bookingsStr) : [];
  const payments = paymentsStr ? JSON.parse(paymentsStr) : [];

  const revenue = payments
    .filter((p: any) => p.status === "success")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  // Grouping engagement velocity by month names
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonth = new Date().getMonth();
  
  // Generate a rolling 6-month trend
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = monthNames[monthIndex];
    
    // Count bookings for this month
    const count = bookings.filter((b: any) => {
      const date = new Date(b.createdAt || Date.now());
      return date.getMonth() === monthIndex;
    }).length;

    chartData.push({
      name: monthName,
      engagements: count || Math.floor(Math.random() * 10) + 2, // Seeding some mock trend data for visual fidelity
    });
  }

  return {
    totalUsers: users.length,
    totalBookings: bookings.length,
    revenue,
    chartData,
  };
};
