import { irForward } from '@/lib/ir-api';

// Published performance metrics.
// Previously served hardcoded seed data from this file; it now proxies to ir-service, which owns
// the records and scopes them to the caller.
export const dynamic = 'force-dynamic';

export const PUT = (req: Request) => irForward(req, '/performance/metrics');
export const GET = (req: Request) => irForward(req, '/performance/metrics');
