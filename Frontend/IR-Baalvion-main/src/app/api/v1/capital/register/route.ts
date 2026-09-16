import { irForward } from '@/lib/ir-api';

// Operator (IR / finance) capital endpoints. ir-service enforces the staff role — this route is a
// transport, not a gate, so it never decides who may see the register.
export const dynamic = 'force-dynamic';

export const GET = (req: Request) => irForward(req, '/capital/admin/register');
