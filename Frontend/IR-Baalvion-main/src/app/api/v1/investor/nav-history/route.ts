import { irGet } from '@/lib/ir-api';

// Proxies to ir-service, which owns the capital ledgers and scopes the read to the caller.
// This route previously returned a hardcoded position — a commitment, a NAV, an IRR that came
// from nowhere. It now returns only what the ledgers actually hold.
export const dynamic = 'force-dynamic';

export const GET = () => irGet('/capital/nav-history');
