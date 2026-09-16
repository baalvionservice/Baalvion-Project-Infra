import { irForward } from '@/lib/ir-api';

// Records money actually received against a call allocation. ir-service requires a bank
// settlement reference and refuses receipts larger than the amount called.
export const dynamic = 'force-dynamic';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return irForward(req, `/capital/admin/allocations/${encodeURIComponent(id)}/settle`);
}
