import { NextRequest } from "next/server";
import { proxyAuth } from "../_proxy";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyAuth(req, "/v1/auth/reset-password", { forwardBody: true });
}
