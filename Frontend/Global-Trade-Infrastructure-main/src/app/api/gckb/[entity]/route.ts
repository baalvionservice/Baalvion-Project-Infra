/**
 * @file app/api/gckb/[entity]/route.ts
 * @description Collection endpoints for a GCKB entity type: search/list and create.
 */
import { ok, toErrorResponse, parsePagination, rateLimit, clientKey } from '@/server/http/api';
import { kbRequest, assertEntity } from '@/server/gckb/http';
import { gckbService } from '@/server/services/gckb-service';
import { createRecordSchema } from '@/server/gckb/schemas';
import type { GckbStatus } from '@/server/gckb/types';

export const runtime = 'nodejs';

export async function GET(req: Request, ctx: { params: Promise<{ entity: string }> }) {
  try {
    const { ctx: actor } = kbRequest(req);
    const { entity } = await ctx.params;
    assertEntity(entity);
    const url = new URL(req.url);
    const { page, pageSize } = parsePagination(url);
    const q = url.searchParams;
    const result = await gckbService.search(actor, {
      entityType: entity,
      countryCode: q.get('countryCode') ?? undefined,
      hsCode: q.get('hsCode') ?? undefined,
      productCategory: q.get('productCategory') ?? undefined,
      policyType: q.get('policyType') ?? undefined,
      authority: q.get('authority') ?? undefined,
      code: q.get('code') ?? undefined,
      status: (q.get('status') as GckbStatus) ?? undefined,
      tag: q.get('tag') ?? undefined,
      keyword: q.get('keyword') ?? undefined,
      asOf: q.get('asOf') ?? undefined,
      page,
      pageSize,
    });
    return ok(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ entity: string }> }) {
  try {
    const { principal, ctx: actor } = kbRequest(req);
    const { entity } = await ctx.params;
    assertEntity(entity);
    rateLimit(clientKey(principal, 'gckb-write'), 120, 60_000);
    const body = createRecordSchema.parse(await req.json());
    const record = await gckbService.create(actor, entity, body);
    return ok(record, 201);
  } catch (err) {
    return toErrorResponse(err);
  }
}
