import { NextRequest } from "next/server";

import { proxyDeveloperService } from "@/lib/developer-api.server";

export async function GET(request: NextRequest) {
  return proxyDeveloperService(request, "/v1/alerts");
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  return proxyDeveloperService(request, "/v1/alerts", { method: "POST", body }, 201);
}
