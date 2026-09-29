import { NextRequest } from "next/server";

import { proxyDeveloperService } from "@/lib/developer-api.server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.text();
  return proxyDeveloperService(request, `/v1/alerts/${id}`, { method: "PATCH", body });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyDeveloperService(request, `/v1/alerts/${id}`, { method: "DELETE" });
}
