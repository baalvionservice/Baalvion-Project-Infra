import { NextRequest, NextResponse } from "next/server";

// Server-side base URL for the Node auth-service. Not NEXT_PUBLIC — the browser
// never talks to it directly; this BFF proxy does (server-to-server, no CORS).
const AUTH = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const isDev = process.env.NODE_ENV !== "production";

/**
 * Forward an auth request to the Node auth-service and relay the JSON body +
 * any Set-Cookie (refresh/csrf) back to the browser on this same origin.
 * In dev (http://localhost) we strip `Secure` so the cookie still sets.
 */
export async function proxyAuth(
  req: NextRequest,
  path: string,
  opts: { forwardBody?: boolean; forwardCookies?: boolean; okOnUnauthorized?: boolean } = {},
): Promise<NextResponse> {
  const { forwardBody = true, forwardCookies = false, okOnUnauthorized = false } = opts;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (forwardCookies) {
    const cookie = req.headers.get("cookie");
    if (cookie) headers["cookie"] = cookie;
  }
  const body = forwardBody ? await req.text() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(`${AUTH}${path}`, { method: "POST", headers, body });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: { code: "AUTH_UNREACHABLE", message: `Auth service unreachable: ${e?.message || e}` } },
      { status: 502 },
    );
  }

  // A missing/expired session is not an error for silent refresh — return an empty 200
  // so the browser console isn't littered with benign 401s on anonymous loads.
  if (okOnUnauthorized && upstream.status === 401) {
    return NextResponse.json({ success: false, data: null }, { status: 200 });
  }

  const text = await upstream.text();
  const res = new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
  });

  const setCookies = (upstream.headers as any).getSetCookie?.() as string[] | undefined;
  const list = setCookies && setCookies.length ? setCookies : (upstream.headers.get("set-cookie") ? [upstream.headers.get("set-cookie") as string] : []);
  for (const c of list) {
    res.headers.append("set-cookie", isDev ? c.replace(/;\s*Secure/gi, "") : c);
  }
  return res;
}
