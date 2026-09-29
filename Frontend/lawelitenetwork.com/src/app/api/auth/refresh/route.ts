import { NextRequest } from "next/server";
import { proxyAuth } from "../_proxy";

export const dynamic = "force-dynamic";

// Uses the httpOnly refresh cookie (forwarded) to mint a fresh access token.
export async function POST(req: NextRequest) {
  return proxyAuth(req, "/v1/auth/refresh", { forwardBody: false, forwardCookies: true, okOnUnauthorized: true });
}
