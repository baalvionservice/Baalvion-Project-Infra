/**
 * @file server/documents/__tests__/template-engine.test.ts
 * @description MODULE 5 — pure document-engine tests. No I/O: data validation,
 * interpolation, line-item table repetition, localization, and JSON/XML/HTML/PDF
 * rendering are all deterministic and database-free.
 */
import { describe, it, expect } from 'vitest';
import { DocumentTemplate } from '../template-types';
import { renderDocument, validateDocumentData } from '../template-engine';

const invoiceTemplate: DocumentTemplate = {
  documentType: 'COMMERCIAL_INVOICE',
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  outputFormats: ['HTML', 'JSON', 'XML', 'PDF'],
  variables: [
    { name: 'invoiceNumber', type: 'string', required: true },
    { name: 'seller', type: 'object', required: true },
    { name: 'buyer', type: 'object', required: true },
    { name: 'lineItems', type: 'array', required: true },
    { name: 'total', type: 'number', required: true },
    { name: 'currency', type: 'string', required: true },
  ],
  sections: [
    {
      id: 'header',
      type: 'fields',
      title: 'invoice.title',
      fields: [
        { label: 'invoice.number', value: '{{invoiceNumber}}' },
        { label: 'invoice.seller', value: '{{seller.name}}' },
        { label: 'invoice.buyer', value: '{{buyer.name}}' },
      ],
    },
    {
      id: 'items',
      type: 'table',
      title: 'invoice.items',
      repeatOver: 'lineItems',
      columns: [
        { header: 'col.desc', value: '{{row.description}}' },
        { header: 'col.qty', value: '{{row.quantity}}' },
        { header: 'col.price', value: '{{row.unitPrice}}' },
      ],
    },
    { id: 'totals', type: 'fields', fields: [{ label: 'invoice.total', value: '{{total}} {{currency}}' }] },
    { id: 'sig', type: 'signature', title: 'invoice.signature' },
    { id: 'qr', type: 'qr', title: 'verify' },
  ],
  validations: [{ field: 'total', rule: 'min', value: 0 }],
  signature: { required: true, standard: 'eIDAS', signatories: ['Authorised signatory'] },
  qr: { enabled: true, contentTemplate: '{{invoiceNumber}}|{{total}}', urlTemplate: 'https://verify.example/{{invoiceNumber}}' },
  labels: {
    en: { 'invoice.title': 'Commercial Invoice', 'invoice.number': 'Invoice No.' },
    fr: { 'invoice.title': 'Facture Commerciale', 'invoice.number': 'No de facture' },
  },
};

const data = {
  invoiceNumber: 'INV-001',
  seller: { name: 'Acme Foods' },
  buyer: { name: 'Globex Trading' },
  lineItems: [
    { description: 'Basmati Rice 5kg', quantity: 10, unitPrice: 5 },
    { description: 'Jasmine Rice 5kg', quantity: 4, unitPrice: 6 },
  ],
  total: 74,
  currency: 'USD',
};

describe('document data validation', () => {
  it('accepts a complete payload', () => {
    expect(validateDocumentData(invoiceTemplate, data).ok).toBe(true);
  });

  it('flags missing required variables and wrong types', () => {
    const { invoiceNumber, ...missing } = data;
    void invoiceNumber;
    const r1 = validateDocumentData(invoiceTemplate, missing);
    expect(r1.ok).toBe(false);
    expect(r1.errors.join(' ')).toMatch(/invoiceNumber/);

    const r2 = validateDocumentData(invoiceTemplate, { ...data, total: 'lots' as unknown as number });
    expect(r2.ok).toBe(false);
  });

  it('enforces explicit validation rules (total ≥ 0)', () => {
    expect(validateDocumentData(invoiceTemplate, { ...data, total: -5 }).ok).toBe(false);
  });
});

describe('rendering', () => {
  it('renders structured JSON with resolved fields and repeated line items', () => {
    const json = JSON.parse(renderDocument(invoiceTemplate, data, { format: 'JSON' }));
    expect(json.documentType).toBe('COMMERCIAL_INVOICE');
    const header = json.sections.find((s: { id: string }) => s.id === 'header');
    expect(header.fields[0].value).toBe('INV-001');
    expect(header.fields[0].label).toBe('Invoice No.'); // localized (en)
    const items = json.sections.find((s: { id: string }) => s.id === 'items');
    expect(items.rows).toHaveLength(2); // one per line item
    expect(items.rows[0][0].value).toBe('Basmati Rice 5kg');
  });

  it('localizes labels by locale', () => {
    const en = JSON.parse(renderDocument(invoiceTemplate, data, { format: 'JSON', locale: 'en' }));
    const fr = JSON.parse(renderDocument(invoiceTemplate, data, { format: 'JSON', locale: 'fr' }));
    expect(en.sections[0].title).toBe('Commercial Invoice');
    expect(fr.sections[0].title).toBe('Facture Commerciale');
  });

  it('renders HTML with localized title, line items, signature and QR', () => {
    const html = renderDocument(invoiceTemplate, data, { format: 'HTML' });
    expect(html).toContain('Commercial Invoice');
    expect(html).toContain('INV-001');
    expect(html).toContain('Basmati Rice 5kg');
    expect(html).toContain('Authorised signatory');
    expect(html).toContain('data-content="INV-001|74"');
    expect(html).toContain('data-document-type="COMMERCIAL_INVOICE"');
  });

  it('renders deterministic XML and print-ready PDF (HTML) without a binary PDF library', () => {
    const xml = renderDocument(invoiceTemplate, data, { format: 'XML' });
    expect(xml.startsWith('<?xml version="1.0"')).toBe(true);
    expect(xml).toContain('<document type="COMMERCIAL_INVOICE"');
    const pdf = renderDocument(invoiceTemplate, data, { format: 'PDF' });
    expect(pdf).toContain('@page'); // print stylesheet
    // Deterministic: identical inputs → identical output.
    expect(renderDocument(invoiceTemplate, data, { format: 'XML' })).toBe(xml);
  });

  it('does not evaluate code in templates (safe interpolation only)', () => {
    const evil = { ...data, invoiceNumber: '{{constructor}}' };
    const html = renderDocument(invoiceTemplate, evil, { format: 'HTML' });
    expect(html).toContain('{{constructor}}'); // treated as a literal string, never executed/resolved
  });
});
