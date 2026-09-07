import { irForward } from '@/lib/ir-api';

// Email-alert subscriptions.
// Previously served hardcoded seed data from this file; it now proxies to ir-service, which owns
// the records and scopes them to the caller.
export const dynamic = 'force-dynamic';

export const GET = (req: Request) => irForward(req, '/subscriptions');
export const POST = (req: Request) => irForward(req, '/subscriptions');
