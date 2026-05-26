import { NextResponse } from 'next/server';

interface ServiceDef {
  name: string;
  url: string;
  port: number;
}

const SERVICES: ServiceDef[] = [
  { name: 'Auth Service',         url: process.env.AUTH_SERVICE_URL    || 'http://localhost:3001', port: 3001 },
  { name: 'Admin Service',        url: process.env.ADMIN_SERVICE_URL   || 'http://localhost:3021', port: 3021 },
  { name: 'Session Service',      url: process.env.SESSION_SERVICE_URL || 'http://localhost:3022', port: 3022 },
  { name: 'OAuth Service',        url: process.env.OAUTH_SERVICE_URL   || 'http://localhost:3023', port: 3023 },
  { name: 'Notification Service', url: process.env.NOTIF_SERVICE_URL   || 'http://localhost:3031', port: 3031 },
  { name: 'CTM Service',          url: process.env.CTM_SERVICE_URL     || 'http://localhost:3011', port: 3011 },
];

async function checkService(svc: ServiceDef) {
  const start = Date.now();
  try {
    const res = await fetch(`${svc.url}/health`, {
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    const latencyMs = Date.now() - start;
    return {
      name:      svc.name,
      url:       svc.url,
      port:      svc.port,
      status:    res.ok ? 'up' : 'down',
      latencyMs,
      checkedAt: new Date().toISOString(),
    } as const;
  } catch {
    return {
      name:      svc.name,
      url:       svc.url,
      port:      svc.port,
      status:    'down' as const,
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function GET() {
  const results = await Promise.all(SERVICES.map(checkService));
  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
