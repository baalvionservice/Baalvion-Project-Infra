import { getSessionFromCookie, type UserSession } from "@/lib/auth/session";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { cookies, headers } from "next/headers";
import {
  REFRESH_COOKIE,
  mintAccessToken,
  userFromRefresh,
} from "@/lib/auth/local-auth";

// Reads the session cookie per request — must never be statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Investor dashboard (server component). Fetches all investor data with the JWT forwarded as a
 * Bearer header.
 *
 * Standalone mode: the session is resolved from the httpOnly `baalvion_refresh` cookie, a matching
 * access token is minted server-side, and data is fetched from the app's own same-origin route
 * handlers (NEXT_PUBLIC_IR_API_URL empty → absolute URL derived from the request host).
 * Backend mode: NEXT_PUBLIC_IR_API_URL points at ir-service and the legacy access-token cookie
 * (if present) is forwarded.
 */
async function getDashboardData(baseUrl: string, authToken?: string) {
  async function serverFetch(path: string) {
    try {
      const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) fetchHeaders["Authorization"] = `Bearer ${authToken}`;
      const res = await fetch(`${baseUrl}${path}`, { headers: fetchHeaders, cache: "no-store" });
      if (!res.ok) return { data: null };
      return res.json();
    } catch {
      return { data: null };
    }
  }

  const [summary, calls, distributions, navHistory, documents, votes] = await Promise.all([
    serverFetch("/api/v1/investor/capital-summary"),
    serverFetch("/api/v1/investor/capital-calls"),
    serverFetch("/api/v1/investor/distributions"),
    serverFetch("/api/v1/investor/nav-history"),
    serverFetch("/api/v1/investor/documents"),
    serverFetch("/api/v1/investor/active-votes"),
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

    // Resolve the session + a forwardable bearer. Standalone mode uses the refresh cookie;
    // backend mode falls back to the legacy access-token cookie.
    const refreshUser = userFromRefresh(cookieStore.get(REFRESH_COOKIE)?.value);
    let bearer: string | undefined;
    let session: UserSession;
    if (refreshUser) {
      bearer = mintAccessToken(refreshUser);
      session = { uid: refreshUser.id, email: refreshUser.email, role: refreshUser.role };
    } else {
      bearer = cookieStore.get("ir_baalvion_access_token")?.value;
      session = getSessionFromCookie(bearer);
    }

    // Resolve an absolute base URL for server-side fetch (relative URLs are not allowed there).
    const configured = process.env.NEXT_PUBLIC_IR_API_URL;
    let baseUrl: string;
    if (configured && configured.trim()) {
      baseUrl = configured;
    } else {
      const h = await headers();
      const host = h.get("host") || "localhost:3027";
      // Derive the scheme from the actual request, not NODE_ENV. A local production
      // build (`next start`) serves over HTTP, so hard-coding "https" in production made
      // every same-origin investor-data fetch fail → an empty $0 dashboard. Prefer the
      // proxy-provided x-forwarded-proto; fall back to http for localhost/loopback.
      const isLocal = /^(localhost|127\.|\[::1\])/.test(host);
      const proto = h.get("x-forwarded-proto")?.split(",")[0] || (isLocal ? "http" : "https");
      baseUrl = `${proto}://${host}`;
    }

    let data;
    try {
      data = await getDashboardData(baseUrl, bearer);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
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

    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Dashboard Temporarily Unavailable</h1>
          <p className="text-muted-foreground mb-4">
            We&apos;re experiencing technical difficulties. Please try again later.
          </p>
          <p className="text-sm text-muted-foreground">
            Please refresh the page or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }
}
