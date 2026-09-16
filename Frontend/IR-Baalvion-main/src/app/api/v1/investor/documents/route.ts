import { irForward } from '@/lib/ir-api';

// Documents the investor is entitled to; ir-service filters by org and publication state.
// Previously served hardcoded seed data from this file; it now proxies to ir-service, which owns
// the records and scopes them to the caller.
export const dynamic = 'force-dynamic';

export const GET = (req: Request) => irForward(req, '/documents');
