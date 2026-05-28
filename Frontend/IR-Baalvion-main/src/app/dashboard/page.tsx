import { getSessionFromCookie } from "@/lib/auth/session";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { cookies } from "next/headers";
// investorApi is used for client-side data fetching in DashboardClient.
// This server component uses a direct fetch with the forwarded JWT token.
// import { investorApi } from "@/lib/api-client";

/**
 * Fetches all investor dashboard data from ir-service via investorApi.
 * Server component — the JWT is forwarded via the Authorization header
 * when the request originates from the browser (cookie is picked up by
 * irAuthClient on the client, or passed as a server-side header here).
 */
async function getDashboardData(authToken?: string) {
  const IR_URL = process.env.NEXT_PUBLIC_IR_API_URL || 'https://api.baalvion.com/api/v1/ecosystem/ir';

  // Server-side helper that forwards the JWT without going through irAuthClient
  // (which requires window/localStorage). We directly call the IR service with
  // the token extracted from the request cookie.
  async function serverFetch(path: string) {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`${IR_URL}${path}`, { headers, cache: 'no-store' });
      if (!res.ok) return { data: null };
      return res.json();
    } catch {
      return { data: null };
    }
  }

  const [summary, calls, distributions, navHistory, documents, votes] =
    await Promise.all([
      serverFetch('/api/v1/investor/capital-summary'),
      serverFetch('/api/v1/investor/capital-calls'),
      serverFetch('/api/v1/investor/distributions'),
      serverFetch('/api/v1/investor/nav-history'),
      serverFetch('/api/v1/investor/documents'),
      serverFetch('/api/v1/investor/active-votes'),
    ]);

  return {
    summary: summary?.data || null,
    calls: calls?.data || [],
    distributions: distributions?.data || [],
    navHistory: navHistory?.data || [],
    documents: documents?.data || [],
    votes: votes?.data || [],
  };
}

export default async function DashboardPage() {
  try {
    const cookieStore = await cookies();

    // Prefer real JWT token; fall back to legacy mock cookie for transition period
    const jwtToken = cookieStore.get("ir_baalvion_access_token")?.value;
    const mockCookie = cookieStore.get("baalvion_session_mock")?.value;
    const session = getSessionFromCookie(jwtToken || mockCookie);

    // Add error boundary for data fetching
    let data;
    try {
      data = await getDashboardData(jwtToken);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      // Provide fallback data structure
      data = {
        summary: null,
        calls: [],
        distributions: [],
        navHistory: [],
        documents: [],
        votes: [],
      };
    }

    return (
      <DashboardClient
        data={data}
        userEmail={session?.email || "guest@baalvion.com"}
        userRole={session?.role || "public"}
      />
    );
  } catch (error) {
    console.error("Dashboard page error:", error);

    // Fallback UI for production errors
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">
            Dashboard Temporarily Unavailable
          </h1>
          <p className="text-muted-foreground mb-4">
            We're experiencing technical difficulties. Please try again later.
          </p>
          <p className="text-sm text-muted-foreground">
            Please refresh the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }
}
