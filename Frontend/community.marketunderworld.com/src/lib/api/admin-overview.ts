// Admin console landing counts from community-service GET /admin/overview (platform admin only).

export interface AdminOverview {
  inventory: { clubs: number; listings: number; upcomingEvents: number; activeGigs: number; hunters: number };
  queues: {
    pendingBookings: number;
    pendingApplications: number;
    pendingProfiles: number;
    pendingEmployers: number;
    submittedReports: number;
    unreadThreads: number;
  };
}

export async function adminOverview(): Promise<AdminOverview> {
  const res = await fetch('/api/community-proxy/admin/overview', { credentials: 'include', cache: 'no-store' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.error?.message || `Request failed (${res.status})`);
  return body.data as AdminOverview;
}
