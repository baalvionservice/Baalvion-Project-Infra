import authClient from "@/lib/auth-client";
import { getMockUserDashboard, getMockUserPortfolio } from "@/services/mock-api/user-dashboard";
import type {
  UserDashboardData,
  UserPortfolioData,
  WatchlistItem,
} from "@/types/user-system";

/**
 * @fileOverview Per-user portfolio + watchlist — LIVE from imperialpedia-service (auth-gated),
 * priced off the live /assets feed. Used CLIENT-side (the access token is in memory). When the
 * user isn't signed in or the service is unreachable, falls back to the mock dashboard so the
 * page always renders. Live data overrides the watchlist + portfolio_summary of the mock shape.
 */

const IMP_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || "http://localhost:3004/api/v1";

async function authedGet<T>(path: string): Promise<T | null> {
  const token = await authClient.getValidToken().catch(() => null);
  if (!token) return null;
  const res = await fetch(`${IMP_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return (json?.data ?? null) as T | null;
}

export async function fetchLiveWatchlist(): Promise<WatchlistItem[] | null> {
  return authedGet<WatchlistItem[]>("/portfolio/watchlist");
}

interface LivePortfolio {
  positions: unknown[];
  summary: {
    total_value: string;
    gain_loss: string;
    gain_loss_percent: string;
    total_gain_loss: string;
    total_gain_loss_percent: string;
    allocation: { asset: string; percentage: number; value: number }[];
    history: { date: string; value: number }[];
    performance_chart_data: { date: string; value: number }[];
  };
}

export async function fetchLivePortfolio(): Promise<LivePortfolio | null> {
  return authedGet<LivePortfolio>("/portfolio");
}

// Build the dashboard view: full mock shape, with live watchlist + portfolio_summary overlaid.
export async function getUserDashboardData(): Promise<UserDashboardData> {
  const base = (await getMockUserDashboard()).data;
  try {
    const [wl, pf] = await Promise.all([fetchLiveWatchlist(), fetchLivePortfolio()]);
    if (!wl && !pf) return base;
    const user = await authClient.getCurrentUser().catch(() => null);
    return {
      ...base,
      user_details: {
        ...base.user_details,
        ...(user?.name ? { name: user.name } : {}),
        ...(user?.email ? { email: user.email } : {}),
      },
      ...(wl && wl.length ? { watchlists_overview: wl } : {}),
      ...(pf
        ? {
            portfolio_summary: {
              ...base.portfolio_summary,
              total_value: pf.summary.total_value,
              gain_loss: pf.summary.gain_loss,
              gain_loss_percent: pf.summary.gain_loss_percent,
              allocation: pf.summary.allocation,
              history: pf.summary.history,
            },
          }
        : {}),
    };
  } catch {
    return base;
  }
}

export async function getUserPortfolioData(): Promise<UserPortfolioData> {
  const base = (await getMockUserPortfolio()).data;
  try {
    const [wl, pf] = await Promise.all([fetchLiveWatchlist(), fetchLivePortfolio()]);
    if (!wl && !pf) return base;
    return {
      ...base,
      ...(wl && wl.length
        ? { watchlists: [{ id: "wg-live", name: "My Watchlist", assets: wl }] }
        : {}),
      ...(pf
        ? {
            portfolio_summary: {
              ...base.portfolio_summary,
              total_value: pf.summary.total_value,
              total_gain_loss: pf.summary.total_gain_loss,
              total_gain_loss_percent: pf.summary.total_gain_loss_percent,
              allocation: pf.summary.allocation,
              performance_chart_data: pf.summary.performance_chart_data,
            },
          }
        : {}),
    };
  } catch {
    return base;
  }
}
