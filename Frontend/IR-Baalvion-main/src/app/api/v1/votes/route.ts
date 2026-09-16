import { irForward } from '@/lib/ir-api';

// Governance resolutions. Read is public where ir-service publishes them.
// Previously served hardcoded seed data from this file; it now proxies to ir-service, which owns
// the records and scopes them to the caller.
export const dynamic = 'force-dynamic';

export const GET = (req: Request) => irForward(req, '/votes', false);
export const POST = (req: Request) => irForward(req, '/votes', false);
