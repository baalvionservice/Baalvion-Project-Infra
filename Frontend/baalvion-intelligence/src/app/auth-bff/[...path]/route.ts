import { NextRequest, NextResponse } from "next/server";

// Next.js `rewrites()` proxies via fetch() in `redirect: 'follow'` mode, which silently
// resolves upstream 3xx responses server-side instead of handing them to the browser —
// breaks the OAuth start/callback redirects (to Google, and back) entirely. This handler
// proxies manually so 3xx + Location + Set-Cookie all reach the browser untouched, keeping
// the auth-service refresh cookie first-party to this origin.
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "https://auth-api.baalvion.com";

async function proxy(request: NextRequest, path: string[]) {
  const target = new URL(`${AUTH_SERVICE_URL}/v1/auth/${path.join("/")}`);
  target.search = request.nextUrl.search;

  const upstream = await fetch(target, {
    method: request.method,
    headers: {
      cookie: request.headers.get("cookie") ?? "",
      "content-type": request.headers.get("content-type") ?? "application/json",
    },
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
    redirect: "manual",
  });

  // Opaque redirect (status 0 in some runtimes) or a real 3xx — either way, forward it
  // as-is so the browser performs the navigation itself.
  if (upstream.status >= 300 && upstream.status < 400) {
    const response = new NextResponse(null, {
      status: upstream.status,
      headers: { location: upstream.headers.get("location") ?? "/" },
    });
    for (const cookie of upstream.headers.getSetCookie()) {
      response.headers.append("set-cookie", cookie);
    }
    return response;
  }

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await params).path);
}
