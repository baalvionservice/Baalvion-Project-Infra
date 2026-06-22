/**
 * @file app/api/gckb/[entity]/import/route.ts
 * @description Bulk import for a GCKB entity (spec §IMPORT). Parses CSV/JSON,
 * validates every row, and either previews (dryRun) or commits in a single
 * transaction (rollback on any error). Returns a structured error report.
 */
import { NextResponse } from 'next/server';
import { ok, toErrorResponse, rateLimit, clientKey } from '@/server/http/api';
import { kbRequest, assertEntity } from '@/server/gckb/http';
import { gckbService } from '@/server/services/gckb-service';
import { importSchema } from '@/server/gckb/schemas';
import { parseImport, validateImport, ImportFormat } from '@/server/gckb/import-engine';

export const runtime = 'nodejs';

export async function POST(req: Request, ctx: { params: Promise<{ entity: string }> }) {
  try {
    const { principal, ctx: actor } = kbRequest(req);
    const { entity } = await ctx.params;
    assertEntity(entity);
    rateLimit(clientKey(principal, 'gckb-import'), 20, 60_000);

    const body = importSchema.parse(await req.json());
    const format = body.format as ImportFormat;
    const content = body.content ?? JSON.stringify(body.rows ?? []);
    const sourceFormat: ImportFormat = body.content ? format : 'json';

    const inputs = parseImport(sourceFormat, content);
    const { report, validInputs } = validateImport(entity, inputs, format);

    if (report.invalid > 0) {
      // All-or-nothing: refuse to commit a batch with any invalid row.
      return NextResponse.json({ success: false, data: { committed: false, report }, error: 'import validation failed' }, { status: 422 });
    }

    if (body.dryRun) {
      const preview = await gckbService.previewImport(actor, entity, validInputs);
      return ok({ committed: false, dryRun: true, report, preview });
    }

    const result = await gckbService.applyImport(actor, entity, validInputs);
    return ok({ committed: true, report, result });
  } catch (err) {
    return toErrorResponse(err);
  }
}
