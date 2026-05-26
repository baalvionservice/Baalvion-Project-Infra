
/**
 * @fileOverview AdminService V2
 * Primary service layer for platform oversight, including Risk and AI protocols.
 */

import {
  getAllUsersMock,
  getAllLawyersMock,
  getAllBookingsMock,
} from "@/lib/mock/adminMock";

/**
 * Retrieves all registered members across the network.
 */
export const getAllUsers = async () => {
  // Simulate network latency for executive feel
  await new Promise(resolve => setTimeout(resolve, 600));
  return getAllUsersMock();
};

/**
 * Retrieves all practitioners currently listed in the marketplace.
 */
export const getAllLawyers = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return getAllLawyersMock();
};

/**
 * Retrieves the complete ledger of consultation engagements.
 */
export const getAllBookings = async () => {
  await new Promise(resolve => setTimeout(resolve, 700));
  return getAllBookingsMock();
};

/**
 * Aggregates platform-wide intelligence for administrative review.
 */
export const getAnalyticsData = async () => {
  // Simulate deep-ledger audit latency
  await new Promise(resolve => setTimeout(resolve, 1200));

  const users = getAllUsersMock();
  const bookingsStr = typeof window !== 'undefined' ? localStorage.getItem("law_elite_bookings") : null;
  const paymentsStr = typeof window !== 'undefined' ? localStorage.getItem("law_elite_payments") : null;

  const bookings = bookingsStr ? JSON.parse(bookingsStr) : [];
  const payments = paymentsStr ? JSON.parse(paymentsStr) : [];

  // Calculate gross settlement revenue
  const revenue = payments
    .filter((p: any) => p.status === "paid" || p.status === "success")
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return {
    totalUsers: users.length,
    totalLawyers: 5, // Curated initial network count
    totalBookings: bookings.length,
    revenue,
  };
};

/**
 * MOCK: AI Protocol Analysis
 */
export const analyzePlatformHealth = async () => {
  return {
    score: 98,
    integrity: "Verified",
    lastAudit: new Date().toISOString()
  };
};
