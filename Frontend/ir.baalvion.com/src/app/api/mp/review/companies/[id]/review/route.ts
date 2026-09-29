import { forward } from '@/lib/mp-forward';

// Approve or reject. The decision and every rule behind it live in marketplace-service.
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return forward(req, `/admin/companies/${encodeURIComponent(id)}/review`);
}
