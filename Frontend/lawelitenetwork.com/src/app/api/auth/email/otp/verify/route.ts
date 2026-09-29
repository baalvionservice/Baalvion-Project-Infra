import { NextRequest } from "next/server";
import { proxyAuth } from "../../../_proxy";

export const dynamic = "force-dynamic";

// Step 2: exchange the code for a session. auth-service find-or-creates the account and mints
// the same RS256 pair as password login, so the Set-Cookie relay in _proxy is what establishes
// the httpOnly refresh cookie on this origin — exactly as /api/auth/login does.
export async function POST(req: NextRequest) {
  return proxyAuth(req, "/v1/auth/email/otp/verify", { forwardBody: true });
}
