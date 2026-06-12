import { NextResponse } from 'next/server';

// Update a subscription's preferences (standalone mode — acknowledged, echoed back).
export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json().catch(() => ({}));
  return NextResponse.json({
    success: true,
    data: { id, role: 'p1_institutional', email: '', active: true, ...patch },
  });
}
