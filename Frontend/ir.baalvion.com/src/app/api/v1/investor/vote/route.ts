import { irForward } from '@/lib/ir-api';

// Casts a ballot. ir-service owns eligibility and one-vote-per-holder.
// Previously served hardcoded seed data from this file; it now proxies to ir-service, which owns
// the records and scopes them to the caller.
export const dynamic = 'force-dynamic';

export const POST = (req: Request) => irForward(req, '/votes');
