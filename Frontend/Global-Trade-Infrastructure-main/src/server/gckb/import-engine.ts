/**
 * @file server/gckb/import-engine.ts
 * @description Bulk import parsing + validation for the GCKB (spec §IMPORT). Pure
 * and DB-free: parse CSV/JSON into write inputs, coerce scalar columns, validate
 * each row against the registry, derive natural keys and detect in-file
 * duplicates, and produce a structured error report. The transactional commit
 * (with rollback) and new-vs-update classification live in gckb-service.ts.
 *
 * CSV and JSON are implemented here. XML and Excel are recognised formats whose
 * adapters are intentionally not enabled (documented in IMPORT spec); they fail
 * with a clear, actionable error rather than silently doing nothing.
 */
import { getEntityDefinition } from './registry';
import { KbWriteInput } from './types';

export type ImportFormat = 'csv' | 'json' | 'xml' | 'excel';

const RESERVED = new Set([
  'recordKey',
  'name',
  'countryCode',
  'code',
  'policyType',
  'hsCode',
  'productCategory',
  'tags',
  'status',
  'effectiveFrom',
  'effectiveTo',
  'authority',
  'source',
  'auditReference',
  'attributes',
]);

export interface ImportRowError {
  row: number;
  recordKey?: string;
  errors: string[];
}

export interface ImportReport {
  entityType: string;
  format: ImportFormat;
  total: number;
  valid: number;
  invalid: number;
  duplicatesInFile: number;
  errors: ImportRowError[];
}

export interface ParsedImport {
  report: ImportReport;
  validInputs: KbWriteInput[];
}

/** Minimal RFC-4180-ish CSV parser: handles quotes, escaped quotes and newlines. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((f) => f.length > 0) || row.length > 1) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.length > 0)) rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim();
    });
    return obj;
  });
}

function coerceScalar(value: string): unknown {
  if (value === '') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (value.startsWith('{') || value.startsWith('[')) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function rowToInput(raw: Record<string, unknown>, format: ImportFormat): KbWriteInput {
  const isFlat = format === 'csv';
  const get = (k: string): unknown => raw[k];

  let attributes: Record<string, unknown>;
  if (raw.attributes !== undefined && raw.attributes !== '') {
    attributes = typeof raw.attributes === 'string' ? (JSON.parse(raw.attributes) as Record<string, unknown>) : (raw.attributes as Record<string, unknown>);
  } else {
    attributes = {};
    for (const [k, v] of Object.entries(raw)) {
      if (RESERVED.has(k)) continue;
      const coerced = isFlat ? coerceScalar(String(v ?? '')) : v;
      if (coerced !== undefined) attributes[k] = coerced;
    }
  }

  const tagsRaw = get('tags');
  const tags = Array.isArray(tagsRaw)
    ? (tagsRaw as string[])
    : typeof tagsRaw === 'string' && tagsRaw
      ? tagsRaw.split('|').map((t) => t.trim()).filter(Boolean)
      : undefined;

  const str = (k: string): string | undefined => {
    const v = get(k);
    return v === undefined || v === '' ? undefined : String(v);
  };

  return {
    recordKey: str('recordKey'),
    name: String(get('name') ?? ''),
    attributes,
    countryCode: str('countryCode'),
    code: str('code'),
    policyType: str('policyType'),
    hsCode: str('hsCode'),
    productCategory: str('productCategory'),
    tags,
    status: str('status') as KbWriteInput['status'],
    envelope: {
      effectiveFrom: str('effectiveFrom') ?? null,
      effectiveTo: str('effectiveTo') ?? null,
      authority: str('authority') ?? null,
      source: str('source') ?? null,
      auditReference: str('auditReference') ?? null,
    },
  };
}

/** Parse raw import content (CSV text or JSON array) into typed write inputs. */
export function parseImport(format: ImportFormat, content: string): KbWriteInput[] {
  if (format === 'xml' || format === 'excel') {
    throw new Error(`Import format "${format}" adapter is not enabled in this deployment; use CSV or JSON (see IMPORT spec).`);
  }
  if (format === 'csv') {
    return parseCsv(content).map((r) => rowToInput(r, 'csv'));
  }
  // json
  const parsed = JSON.parse(content);
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.records) ? parsed.records : null;
  if (!rows) throw new Error('JSON import must be an array of records, or { "records": [...] }');
  return (rows as Record<string, unknown>[]).map((r) => rowToInput(r, 'json'));
}

/**
 * Validate parsed inputs against the registry, derive natural keys, detect
 * in-file duplicates, and produce a per-row error report. Pure — no I/O.
 */
export function validateImport(entityType: string, inputs: KbWriteInput[], format: ImportFormat = 'json'): ParsedImport {
  const def = getEntityDefinition(entityType);
  const errors: ImportRowError[] = [];
  const validInputs: KbWriteInput[] = [];
  const seen = new Map<string, number>();
  let duplicatesInFile = 0;

  if (!def) {
    return {
      validInputs: [],
      report: { entityType, format, total: inputs.length, valid: 0, invalid: inputs.length, duplicatesInFile: 0, errors: [{ row: 0, errors: [`Unknown entity type "${entityType}"`] }] },
    };
  }

  inputs.forEach((input, idx) => {
    const row = idx + 1;
    const rowErrors: string[] = [];
    if (!input.name) rowErrors.push('name is required');
    if (def.countryScoped && !input.countryCode) rowErrors.push('countryCode is required');
    if (def.usesPolicyType && !input.policyType) rowErrors.push('policyType is required');

    let recordKey: string | undefined;
    if (rowErrors.length === 0) {
      const validation = def.validate(input);
      if (!validation.ok) rowErrors.push(...validation.errors);
    }
    if (rowErrors.length === 0) {
      try {
        recordKey = def.deriveRecordKey(input);
        if (seen.has(recordKey)) {
          duplicatesInFile += 1;
          rowErrors.push(`duplicate of row ${seen.get(recordKey)} (recordKey "${recordKey}")`);
        } else {
          seen.set(recordKey, row);
        }
      } catch (err) {
        rowErrors.push(err instanceof Error ? err.message : 'failed to derive record key');
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row, recordKey, errors: rowErrors });
    } else {
      validInputs.push(input);
    }
  });

  return {
    validInputs,
    report: {
      entityType,
      format,
      total: inputs.length,
      valid: validInputs.length,
      invalid: errors.length,
      duplicatesInFile,
      errors,
    },
  };
}
