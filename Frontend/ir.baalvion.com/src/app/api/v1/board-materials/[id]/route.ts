import { irForward } from '@/lib/ir-api';

// Single-record proxy to ir-service. Kept alongside the collection route so the browser client's
// detail/update/delete paths resolve same-origin rather than cross-origin to the public API.
export const dynamic = 'force-dynamic';

async function handler(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return irForward(req, `/board-materials/${encodeURIComponent(id)}`);
}

export const GET = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
