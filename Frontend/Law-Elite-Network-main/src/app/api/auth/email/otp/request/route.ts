import { NextRequest } from "next/server";
import { proxyAuth } from "../../../_proxy";

export const dynamic = "force-dynamic";

// Step 1 of passwordless sign-in: auth-service emails a one-time code. No session yet, so
// nothing to forward — the body carries the address (and first/last name for a new account).
export async function POST(req: NextRequest) {
  return proxyAuth(req, "/v1/auth/email/otp/request", { forwardBody: true });
}
