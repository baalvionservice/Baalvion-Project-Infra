/**
 * @file server/documents/template-engine.ts
 * @description MODULE 5 — Universal Document Engine: a pure, deterministic,
 * dependency-free renderer. Given a template (configuration) + a data context, it
 * (1) validates the data against the template's declared variables and validation
 * rules, then (2) renders to JSON / XML / HTML / PDF (print-ready HTML). All
 * variable resolution uses a safe `{{ path }}` interpolator — there is no `eval`
 * and no template-injection surface. Rendering is side-effect-free and identical
 * for identical inputs, so it is fully unit-testable without a database.
 */
import { DocumentTemplate, OutputFormat, TemplateSection } from './template-types';

export interface RenderOptions {
  format: OutputFormat;
  locale?: string;
  /** Optional precomputed content hash for the QR payload. */
  hash?: string;
}

export type DocumentData = Record<string, unknown>;

export interface ValidationOutcome {
  ok: boolean;
  errors: string[];
}

// ── Safe value resolution ─────────────────────────────────────────────────────

/** Resolve a dotted path (`a.b.c`) against a context. Returns undefined if absent. */
function resolvePath(context: Record<string, unknown>, path: string): unknown {
  return path
    .trim()
    .split('.')
    .reduce<unknown>((acc, key) => {
      if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
      return undefined;
    }, context);
}

function scalarToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** Replace every `{{ path }}` token with the resolved (string-coerced) value. */
function interpolate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.[\]]+)\s*\}\}/g, (_m, path: string) => scalarToString(resolvePath(context, path)));
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value: string): string {
  return escapeHtml(value);
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate input data against a template: required variables present, declared
 * types broadly respected, and explicit validation rules satisfied.
 */
export function validateDocumentData(template: DocumentTemplate, data: DocumentData): ValidationOutcome {
  const errors: string[] = [];

  for (const v of template.variables) {
    const present = v.name in data && data[v.name] !== undefined && data[v.name] !== null;
    if (v.required && !present) {
      errors.push(`variable "${v.name}" is required`);
      continue;
    }
    if (!present) continue;
    const value = data[v.name];
    const typeOk =
      (v.type === 'array' && Array.isArray(value)) ||
      (v.type === 'object' && typeof value === 'object' && !Array.isArray(value)) ||
      (v.type === 'number' && typeof value === 'number') ||
      (v.type === 'boolean' && typeof value === 'boolean') ||
      (v.type === 'date' && (typeof value === 'string' || value instanceof Date)) ||
      (v.type === 'string' && typeof value === 'string');
    if (!typeOk) errors.push(`variable "${v.name}" must be a ${v.type}`);
  }

  for (const rule of template.validations ?? []) {
    const value = resolvePath(data, rule.field);
    const fail = (msg: string) => errors.push(rule.message ?? msg);
    switch (rule.rule) {
      case 'required':
        if (value === undefined || value === null || value === '') fail(`field "${rule.field}" is required`);
        break;
      case 'nonEmpty':
        if (Array.isArray(value) ? value.length === 0 : !value) fail(`field "${rule.field}" must not be empty`);
        break;
      case 'min':
        if (typeof value === 'number' && typeof rule.value === 'number' && value < rule.value) fail(`field "${rule.field}" must be ≥ ${rule.value}`);
        break;
      case 'max':
        if (typeof value === 'number' && typeof rule.value === 'number' && value > rule.value) fail(`field "${rule.field}" must be ≤ ${rule.value}`);
        break;
      case 'regex':
        if (typeof value === 'string' && typeof rule.value === 'string' && !new RegExp(rule.value).test(value)) fail(`field "${rule.field}" does not match ${rule.value}`);
        break;
      case 'in':
        if (Array.isArray(rule.value) && !rule.value.includes(value as never)) fail(`field "${rule.field}" must be one of ${(rule.value as unknown[]).join(', ')}`);
        break;
    }
  }

  return { ok: errors.length === 0, errors };
}

// ── Localization ──────────────────────────────────────────────────────────────

function labeller(template: DocumentTemplate, locale: string): (key: string) => string {
  const map = template.labels?.[locale] ?? {};
  return (key: string) => map[key] ?? key;
}

// ── Structured (resolved) document model ──────────────────────────────────────

interface ResolvedSection {
  id: string;
  type: TemplateSection['type'];
  title?: string;
  text?: string;
  fields?: Array<{ label: string; value: string }>;
  rows?: Array<Array<{ header: string; value: string }>>;
  signatories?: string[];
  qr?: { content: string; url?: string };
}

interface ResolvedDocument {
  documentType: string;
  locale: string;
  sections: ResolvedSection[];
}

function resolveDocument(template: DocumentTemplate, data: DocumentData, opts: RenderOptions): ResolvedDocument {
  const locale = opts.locale ?? template.defaultLocale ?? (template.locales?.[0] ?? 'en');
  const t = labeller(template, locale);
  const ctx: Record<string, unknown> = { ...data, hash: opts.hash ?? '' };

  const sections: ResolvedSection[] = template.sections.map((s) => {
    const title = s.title ? t(s.title) : undefined;
    switch (s.type) {
      case 'text':
        return { id: s.id, type: s.type, title, text: interpolate(s.content ?? '', ctx) };
      case 'fields':
        return {
          id: s.id,
          type: s.type,
          title,
          fields: (s.fields ?? []).map((f) => ({ label: t(f.label), value: interpolate(f.value, ctx) })),
        };
      case 'table': {
        const items = (s.repeatOver ? resolvePath(ctx, s.repeatOver) : undefined) as unknown[] | undefined;
        const rows = (Array.isArray(items) ? items : []).map((item) =>
          (s.columns ?? []).map((c) => ({ header: t(c.header), value: interpolate(c.value, { ...ctx, row: item }) })),
        );
        return { id: s.id, type: s.type, title, rows };
      }
      case 'signature':
        return { id: s.id, type: s.type, title, signatories: template.signature?.signatories ?? [] };
      case 'qr':
        return {
          id: s.id,
          type: s.type,
          title,
          qr: {
            content: interpolate(template.qr?.contentTemplate ?? '', ctx),
            url: template.qr?.urlTemplate ? interpolate(template.qr.urlTemplate, ctx) : undefined,
          },
        };
      default:
        return { id: s.id, type: s.type, title };
    }
  });

  return { documentType: template.documentType, locale, sections };
}

// ── Renderers ─────────────────────────────────────────────────────────────────

function renderHtml(doc: ResolvedDocument, forPrint: boolean): string {
  const body = doc.sections
    .map((s) => {
      const heading = s.title ? `<h2>${escapeHtml(s.title)}</h2>` : '';
      if (s.type === 'text') return `<section id="${escapeHtml(s.id)}">${heading}<p>${escapeHtml(s.text ?? '')}</p></section>`;
      if (s.type === 'fields') {
        const rows = (s.fields ?? []).map((f) => `<tr><th>${escapeHtml(f.label)}</th><td>${escapeHtml(f.value)}</td></tr>`).join('');
        return `<section id="${escapeHtml(s.id)}">${heading}<table>${rows}</table></section>`;
      }
      if (s.type === 'table') {
        const header = s.rows?.[0]?.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('') ?? '';
        const rows = (s.rows ?? []).map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c.value)}</td>`).join('')}</tr>`).join('');
        return `<section id="${escapeHtml(s.id)}">${heading}<table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></section>`;
      }
      if (s.type === 'signature') {
        const blocks = (s.signatories ?? []).map((r) => `<div class="sig"><span>${escapeHtml(r)}</span><span class="line"></span></div>`).join('');
        return `<section id="${escapeHtml(s.id)}">${heading}${blocks}</section>`;
      }
      if (s.type === 'qr') return `<section id="${escapeHtml(s.id)}">${heading}<div class="qr" data-content="${escapeHtml(s.qr?.content ?? '')}"${s.qr?.url ? ` data-url="${escapeHtml(s.qr.url)}"` : ''}></div></section>`;
      return '';
    })
    .join('');
  const printCss = forPrint ? '<style>@page{margin:18mm}body{font-family:serif}</style>' : '';
  return `<!doctype html><html lang="${escapeHtml(doc.locale)}"><head><meta charset="utf-8"><title>${escapeHtml(doc.documentType)}</title>${printCss}</head><body data-document-type="${escapeHtml(doc.documentType)}">${body}</body></html>`;
}

function renderXml(doc: ResolvedDocument): string {
  const sections = doc.sections
    .map((s) => {
      const inner =
        s.type === 'text'
          ? `<text>${escapeXml(s.text ?? '')}</text>`
          : s.type === 'fields'
            ? (s.fields ?? []).map((f) => `<field label="${escapeXml(f.label)}">${escapeXml(f.value)}</field>`).join('')
            : s.type === 'table'
              ? (s.rows ?? []).map((r) => `<row>${r.map((c) => `<cell header="${escapeXml(c.header)}">${escapeXml(c.value)}</cell>`).join('')}</row>`).join('')
              : s.type === 'signature'
                ? (s.signatories ?? []).map((r) => `<signatory>${escapeXml(r)}</signatory>`).join('')
                : s.type === 'qr'
                  ? `<qr content="${escapeXml(s.qr?.content ?? '')}"${s.qr?.url ? ` url="${escapeXml(s.qr.url)}"` : ''}/>`
                  : '';
      return `<section id="${escapeXml(s.id)}" type="${s.type}"${s.title ? ` title="${escapeXml(s.title)}"` : ''}>${inner}</section>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><document type="${escapeXml(doc.documentType)}" locale="${escapeXml(doc.locale)}">${sections}</document>`;
}

/**
 * Render a document. Returns a string for every format; PDF is emitted as
 * print-ready HTML (to be passed to any HTML→PDF renderer downstream — no PDF
 * binary library is bundled in Phase 1).
 */
export function renderDocument(template: DocumentTemplate, data: DocumentData, opts: RenderOptions): string {
  const doc = resolveDocument(template, data, opts);
  switch (opts.format) {
    case 'JSON':
      return JSON.stringify(doc);
    case 'XML':
      return renderXml(doc);
    case 'HTML':
      return renderHtml(doc, false);
    case 'PDF':
      return renderHtml(doc, true); // print-ready HTML (PDF source)
    default:
      return JSON.stringify(doc);
  }
}
