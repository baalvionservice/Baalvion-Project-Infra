/**
 * @file app/api/gckb/[entity]/[id]/route.ts
 * @description A single GCKB record: read (with relationships), update, archive.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { kbRequest, assertEntity } from '@/server/gckb/http';
import { gckbService } from '@/server/services/gckb-service';
import { updateRecordSchema } from '@/server/gckb/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const { ctx: actor } = kbRequest(req);
    const { entity, id } = await ctx.params;
    assertEntity(entity);
    return ok(await gckbService.get(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const { principal, ctx: actor } = kbRequest(req);
    const { entity, id } = await ctx.params;
    assertEntity(entity);
    rateLimit(clientKey(principal, 'gckb-write'), 120, 60_000);
    const body = updateRecordSchema.parse(await req.json());
    return ok(await gckbService.update(actor, id, body));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const { principal, ctx: actor } = kbRequest(req);
    const { entity, id } = await ctx.params;
    assertEntity(entity);
    rateLimit(clientKey(principal, 'gckb-write'), 120, 60_000);
    const reason = new URL(req.url).searchParams.get('reason') ?? undefined;
    return ok(await gckbService.archive(actor, id, reason));
  } catch (err) {
    return toErrorResponse(err);
  }
}
