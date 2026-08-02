import { NextRequest } from "next/server";

import { proxyDeveloperService } from "@/lib/developer-api.server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ plan: string }> }) {
  const { plan } = await params;
  return proxyDeveloperService(request, `/v1/billing/checkout/${encodeURIComponent(plan)}`, { method: "POST" }, 201);
}
