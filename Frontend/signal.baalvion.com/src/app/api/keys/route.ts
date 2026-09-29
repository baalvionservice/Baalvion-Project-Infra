import { NextRequest } from "next/server";

import { proxyDeveloperService } from "@/lib/developer-api.server";

export async function GET(request: NextRequest) {
  return proxyDeveloperService(request, "/v1/keys");
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Default key";
  return proxyDeveloperService(
    request,
    "/v1/keys",
    { method: "POST", body: JSON.stringify({ name, scopes: Array.isArray(body.scopes) ? body.scopes : undefined }) },
    201,
  );
}
