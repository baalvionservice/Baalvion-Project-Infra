import { NextRequest, NextResponse } from "next/server";

const DEVELOPER_SERVICE_URL = process.env.DEVELOPER_SERVICE_URL ?? "http://localhost:3042";

export class DeveloperApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchDeveloperService(authorization: string, path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${DEVELOPER_SERVICE_URL}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization, "content-type": "application/json" },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new DeveloperApiError(body?.error?.message ?? "developer-service request failed", response.status);
  }
  return body?.data;
}

/**
 * Forwards the browser's own RS256 access token to developer-service — the same trust
 * model as auth-service's /me. No service-level secret is involved; a user can only ever
 * manage the API keys their own JWT's orgId is scoped to (see guards.js `orgScope`).
 */
export async function proxyDeveloperService(
  request: NextRequest,
  path: string,
  init?: RequestInit,
  successStatus = 200,
): Promise<NextResponse> {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ success: false, error: { message: "Missing session" } }, { status: 401 });
  }
  try {
    const data = await fetchDeveloperService(authorization, path, init);
    return NextResponse.json({ success: true, data }, { status: successStatus });
  } catch (err) {
    const status = err instanceof DeveloperApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: { message } }, { status });
  }
}
