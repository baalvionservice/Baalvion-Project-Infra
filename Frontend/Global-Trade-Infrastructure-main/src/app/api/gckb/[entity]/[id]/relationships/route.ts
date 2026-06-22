/**
 * @file app/api/gckb/[entity]/[id]/relationships/route.ts
 * @description Typed relationship edges from a GCKB record — list and create.
 */
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { kbRequest, assertEntity } from '@/server/gckb/http';
import { gckbService } from '@/server/services/gckb-service';
import { relationshipSchema } from '@/server/gckb/schemas';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const { ctx: actor } = kbRequest(req);
    const { entity, id } = await ctx.params;
    assertEntity(entity);
    await gckbService.get(actor, id); // scope check
    return ok(await gckbService.listRelationships(actor, id));
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ entity: string; id: string }> }) {
  try {
    const { principal, ctx: actor } = kbRequest(req);
    const { entity, id } = await ctx.params;
    assertEntity(entity);
    rateLimit(clientKey(principal, 'gckb-write'), 120, 60_000);
    const body = relationshipSchema.parse(await req.json());
    return ok(await gckbService.addRelationship(actor, id, body), 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
