/**
 * @file app/api/gckb/[entity]/export/route.ts
 * @description Bulk export for a GCKB entity (spec §API Bulk Export). Returns
 * JSON (default) or CSV of the scoped records matching the same filters as search.
 */
import { NextResponse } from 'next/server';
import { ok, toErrorResponse } from '@/server/http/api';
import { kbRequest, assertEntity } from '@/server/gckb/http';
import { gckbService } from '@/server/services/gckb-service';
import type { GckbStatus } from '@/server/gckb/types';

export const runtime = 'nodejs';

const CSV_COLUMNS = [
  'entityType', 'recordKey', 'name', 'code', 'policyType', 'hsCode', 'productCategory',
  'status', 'version', 'effectiveFrom', 'effectiveTo', 'authority', 'source', 'tags', 'attributes',
] as const;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request, ctx: { params: Promise<{ entity: string }> }) {
  try {
    const { ctx: actor } = kbRequest(req);
    const { entity } = await ctx.params;
    assertEntity(entity);
    const url = new URL(req.url);
    const q = url.searchParams;
    const format = (q.get('format') ?? 'json').toLowerCase();

    const page = await gckbService.search(actor, {
      entityType: entity,
      countryCode: q.get('countryCode') ?? undefined,
      policyType: q.get('policyType') ?? undefined,
      status: (q.get('status') as GckbStatus) ?? undefined,
      keyword: q.get('keyword') ?? undefined,
      page: 1,
      pageSize: 200,
    });

    if (format === 'csv') {
      const header = CSV_COLUMNS.join(',');
      const lines = page.items.map((r) => CSV_COLUMNS.map((c) => csvCell((r as Record<string, unknown>)[c])).join(','));
      const body = [header, ...lines].join('\n');
      return new NextResponse(body, {
        status: 200,
        headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="gckb-${entity}.csv"` },
      });
    }

    return ok({ entityType: entity, count: page.total, records: page.items });
  } catch (err) {
    return toErrorResponse(err);
  }
}
