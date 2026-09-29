import { NextRequest } from "next/server";

import { proxyDeveloperService } from "@/lib/developer-api.server";

export async function GET(request: NextRequest) {
  return proxyDeveloperService(request, "/v1/usage");
}
