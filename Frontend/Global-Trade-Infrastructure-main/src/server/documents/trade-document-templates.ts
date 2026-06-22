/**
 * @file server/documents/trade-document-templates.ts
 * @description The concrete trade-document templates — Commercial Invoice,
 * Packing List, Bill of Lading, Certificate of Origin and Customs Declaration —
 * expressed as pure {@link DocumentTemplate} configuration (config-over-code).
 * Each is rendered by the universal template engine; adding a document type is a
 * data change here, not a code change in the renderer.
 */
import { DocumentTemplate, TemplateSection } from './template-types';

const COMMON_FORMATS = ['PDF', 'HTML', 'JSON', 'XML'] as const;

const signature = (signatories: string[]) => ({ required: true, standard: 'PKI', signatories });

const partyFields = (prefix: string, label: string): TemplateSection => ({
  id: `${prefix}-party`,
  type: 'fields',
  title: label,
  fields: [
    { label: 'Name', value: `{{ ${prefix}.name }}` },
    { label: 'Address', value: `{{ ${prefix}.address }}` },
    { label: 'Country', value: `{{ ${prefix}.country }}` },
    { label: 'Tax / EORI', value: `{{ ${prefix}.taxId }}` },
  ],
});

/** Commercial Invoice. */
const commercialInvoice: DocumentTemplate = {
  documentType: 'COMMERCIAL_INVOICE',
  engineVersion: '1',
  defaultLocale: 'en',
  outputFormats: [...COMMON_FORMATS],
  variables: [
    { name: 'invoiceNumber', type: 'string', required: true },
    { name: 'issueDate', type: 'date', required: true },
    { name: 'currency', type: 'string', required: true },
    { name: 'incoterm', type: 'string' },
    { name: 'seller', type: 'object', required: true },
    { name: 'buyer', type: 'object', required: true },
    { name: 'items', type: 'array', required: true },
    { name: 'subtotal', type: 'number', required: true },
    { name: 'taxTotal', type: 'number' },
    { name: 'grandTotal', type: 'number', required: true },
    { name: 'paymentTerms', type: 'string' },
  ],
  validations: [
    { field: 'invoiceNumber', rule: 'nonEmpty', message: 'invoice number is required' },
    { field: 'items', rule: 'nonEmpty', message: 'at least one line item is required' },
    { field: 'grandTotal', rule: 'min', value: 0, message: 'grand total must be non-negative' },
  ],
  sections: [
    { id: 'title', type: 'text', content: 'COMMERCIAL INVOICE — {{ invoiceNumber }} ({{ issueDate }})' },
    partyFields('seller', 'Seller / Exporter'),
    partyFields('buyer', 'Buyer / Importer'),
    { id: 'terms', type: 'fields', title: 'Terms', fields: [
      { label: 'Incoterm', value: '{{ incoterm }}' },
      { label: 'Currency', value: '{{ currency }}' },
      { label: 'Payment Terms', value: '{{ paymentTerms }}' },
    ] },
    { id: 'lines', type: 'table', title: 'Line Items', repeatOver: 'items', columns: [
      { header: 'Description', value: '{{ row.description }}' },
      { header: 'HS Code', value: '{{ row.hsCode }}' },
      { header: 'Qty', value: '{{ row.quantity }}', align: 'right' },
      { header: 'Unit Price', value: '{{ row.unitPrice }}', align: 'right' },
      { header: 'Line Total', value: '{{ row.lineTotal }}', align: 'right' },
    ] },
    { id: 'totals', type: 'fields', title: 'Totals', fields: [
      { label: 'Subtotal', value: '{{ subtotal }} {{ currency }}' },
      { label: 'Tax', value: '{{ taxTotal }} {{ currency }}' },
      { label: 'Grand Total', value: '{{ grandTotal }} {{ currency }}' },
    ] },
    { id: 'sig', type: 'signature', title: 'Authorised Signature' },
  ],
  signature: signature(['seller']),
  qr: { enabled: true, contentTemplate: 'INV|{{ invoiceNumber }}|{{ grandTotal }}|{{ hash }}' },
};

/** Packing List. */
const packingList: DocumentTemplate = {
  documentType: 'PACKING_LIST',
  engineVersion: '1',
  outputFormats: [...COMMON_FORMATS],
  variables: [
    { name: 'packingListNumber', type: 'string', required: true },
    { name: 'issueDate', type: 'date', required: true },
    { name: 'seller', type: 'object', required: true },
    { name: 'buyer', type: 'object', required: true },
    { name: 'shipmentRef', type: 'string' },
    { name: 'packages', type: 'array', required: true },
    { name: 'totalPackages', type: 'number', required: true },
    { name: 'totalNetWeight', type: 'number' },
    { name: 'totalGrossWeight', type: 'number' },
  ],
  validations: [
    { field: 'packingListNumber', rule: 'nonEmpty' },
    { field: 'packages', rule: 'nonEmpty', message: 'at least one package is required' },
  ],
  sections: [
    { id: 'title', type: 'text', content: 'PACKING LIST — {{ packingListNumber }} ({{ issueDate }})' },
    partyFields('seller', 'Shipper'),
    partyFields('buyer', 'Consignee'),
    { id: 'pkgs', type: 'table', title: 'Packages', repeatOver: 'packages', columns: [
      { header: 'Marks', value: '{{ row.marks }}' },
      { header: 'Description', value: '{{ row.description }}' },
      { header: 'Qty', value: '{{ row.quantity }}', align: 'right' },
      { header: 'Net Wt', value: '{{ row.netWeight }}', align: 'right' },
      { header: 'Gross Wt', value: '{{ row.grossWeight }}', align: 'right' },
      { header: 'Dimensions', value: '{{ row.dimensions }}' },
    ] },
    { id: 'totals', type: 'fields', title: 'Totals', fields: [
      { label: 'Total Packages', value: '{{ totalPackages }}' },
      { label: 'Total Net Weight', value: '{{ totalNetWeight }}' },
      { label: 'Total Gross Weight', value: '{{ totalGrossWeight }}' },
    ] },
  ],
  qr: { enabled: true, contentTemplate: 'PKL|{{ packingListNumber }}|{{ totalPackages }}|{{ hash }}' },
};

/** Bill of Lading. */
const billOfLading: DocumentTemplate = {
  documentType: 'BILL_OF_LADING',
  engineVersion: '1',
  outputFormats: [...COMMON_FORMATS],
  variables: [
    { name: 'blNumber', type: 'string', required: true },
    { name: 'issueDate', type: 'date', required: true },
    { name: 'shipper', type: 'object', required: true },
    { name: 'consignee', type: 'object', required: true },
    { name: 'notifyParty', type: 'object' },
    { name: 'vessel', type: 'string' },
    { name: 'voyageNo', type: 'string' },
    { name: 'portOfLoading', type: 'string', required: true },
    { name: 'portOfDischarge', type: 'string', required: true },
    { name: 'placeOfDelivery', type: 'string' },
    { name: 'containers', type: 'array', required: true },
    { name: 'freightTerms', type: 'string' },
    { name: 'numberOfOriginals', type: 'number' },
  ],
  validations: [
    { field: 'blNumber', rule: 'nonEmpty' },
    { field: 'portOfLoading', rule: 'nonEmpty' },
    { field: 'portOfDischarge', rule: 'nonEmpty' },
    { field: 'containers', rule: 'nonEmpty', message: 'at least one container is required' },
  ],
  sections: [
    { id: 'title', type: 'text', content: 'BILL OF LADING — {{ blNumber }} ({{ issueDate }})' },
    partyFields('shipper', 'Shipper'),
    partyFields('consignee', 'Consignee'),
    { id: 'voyage', type: 'fields', title: 'Carriage', fields: [
      { label: 'Vessel', value: '{{ vessel }}' },
      { label: 'Voyage No', value: '{{ voyageNo }}' },
      { label: 'Port of Loading', value: '{{ portOfLoading }}' },
      { label: 'Port of Discharge', value: '{{ portOfDischarge }}' },
      { label: 'Place of Delivery', value: '{{ placeOfDelivery }}' },
      { label: 'Freight Terms', value: '{{ freightTerms }}' },
    ] },
    { id: 'cntrs', type: 'table', title: 'Containers & Goods', repeatOver: 'containers', columns: [
      { header: 'Container No', value: '{{ row.containerNo }}' },
      { header: 'Seal No', value: '{{ row.sealNo }}' },
      { header: 'Packages', value: '{{ row.packages }}', align: 'right' },
      { header: 'Description', value: '{{ row.description }}' },
      { header: 'Gross Wt', value: '{{ row.grossWeight }}', align: 'right' },
    ] },
    { id: 'originals', type: 'fields', fields: [{ label: 'Number of Originals', value: '{{ numberOfOriginals }}' }] },
    { id: 'sig', type: 'signature', title: 'Carrier Signature' },
  ],
  signature: signature(['carrier']),
  qr: { enabled: true, contentTemplate: 'BL|{{ blNumber }}|{{ hash }}' },
};

/** Certificate of Origin. */
const certificateOfOrigin: DocumentTemplate = {
  documentType: 'CERTIFICATE_OF_ORIGIN',
  engineVersion: '1',
  outputFormats: [...COMMON_FORMATS],
  variables: [
    { name: 'cooNumber', type: 'string', required: true },
    { name: 'issueDate', type: 'date', required: true },
    { name: 'exporter', type: 'object', required: true },
    { name: 'consignee', type: 'object', required: true },
    { name: 'countryOfOrigin', type: 'string', required: true },
    { name: 'transportDetails', type: 'string' },
    { name: 'items', type: 'array', required: true },
    { name: 'declaration', type: 'string' },
    { name: 'chamberOfCommerce', type: 'string' },
  ],
  validations: [
    { field: 'cooNumber', rule: 'nonEmpty' },
    { field: 'countryOfOrigin', rule: 'nonEmpty' },
    { field: 'items', rule: 'nonEmpty' },
  ],
  sections: [
    { id: 'title', type: 'text', content: 'CERTIFICATE OF ORIGIN — {{ cooNumber }} ({{ issueDate }})' },
    partyFields('exporter', 'Exporter'),
    partyFields('consignee', 'Consignee'),
    { id: 'origin', type: 'fields', title: 'Origin', fields: [
      { label: 'Country of Origin', value: '{{ countryOfOrigin }}' },
      { label: 'Transport Details', value: '{{ transportDetails }}' },
    ] },
    { id: 'goods', type: 'table', title: 'Goods', repeatOver: 'items', columns: [
      { header: 'Marks', value: '{{ row.marks }}' },
      { header: 'Description', value: '{{ row.description }}' },
      { header: 'HS Code', value: '{{ row.hsCode }}' },
      { header: 'Origin Criterion', value: '{{ row.originCriterion }}' },
      { header: 'Qty', value: '{{ row.quantity }}', align: 'right' },
    ] },
    { id: 'decl', type: 'text', title: 'Declaration', content: '{{ declaration }}' },
    { id: 'sig', type: 'signature', title: 'Certified By' },
  ],
  signature: signature(['exporter', 'chamberOfCommerce']),
  qr: { enabled: true, contentTemplate: 'COO|{{ cooNumber }}|{{ countryOfOrigin }}|{{ hash }}' },
};

/** Customs Declaration. */
const customsDeclaration: DocumentTemplate = {
  documentType: 'CUSTOMS_DECLARATION',
  engineVersion: '1',
  outputFormats: [...COMMON_FORMATS],
  variables: [
    { name: 'declarationNumber', type: 'string', required: true },
    { name: 'declarationDate', type: 'date', required: true },
    { name: 'regime', type: 'string', required: true }, // IMPORT | EXPORT | TRANSIT
    { name: 'declarant', type: 'object', required: true },
    { name: 'exporter', type: 'object' },
    { name: 'importer', type: 'object' },
    { name: 'customsOffice', type: 'string' },
    { name: 'countryOfOrigin', type: 'string', required: true },
    { name: 'countryOfDestination', type: 'string', required: true },
    { name: 'items', type: 'array', required: true },
    { name: 'totalCustomsValue', type: 'number', required: true },
    { name: 'totalDuty', type: 'number' },
    { name: 'currency', type: 'string', required: true },
  ],
  validations: [
    { field: 'declarationNumber', rule: 'nonEmpty' },
    { field: 'regime', rule: 'in', value: ['IMPORT', 'EXPORT', 'TRANSIT'], message: 'regime must be IMPORT, EXPORT or TRANSIT' },
    { field: 'items', rule: 'nonEmpty' },
    { field: 'totalCustomsValue', rule: 'min', value: 0 },
  ],
  sections: [
    { id: 'title', type: 'text', content: 'CUSTOMS DECLARATION — {{ declarationNumber }} ({{ regime }})' },
    partyFields('declarant', 'Declarant'),
    { id: 'route', type: 'fields', title: 'Route', fields: [
      { label: 'Customs Office', value: '{{ customsOffice }}' },
      { label: 'Country of Origin', value: '{{ countryOfOrigin }}' },
      { label: 'Country of Destination', value: '{{ countryOfDestination }}' },
    ] },
    { id: 'items', type: 'table', title: 'Declared Items', repeatOver: 'items', columns: [
      { header: 'HS Code', value: '{{ row.hsCode }}' },
      { header: 'Description', value: '{{ row.description }}' },
      { header: 'Qty', value: '{{ row.quantity }}', align: 'right' },
      { header: 'Customs Value', value: '{{ row.customsValue }}', align: 'right' },
      { header: 'Duty Rate', value: '{{ row.dutyRate }}', align: 'right' },
    ] },
    { id: 'totals', type: 'fields', title: 'Totals', fields: [
      { label: 'Total Customs Value', value: '{{ totalCustomsValue }} {{ currency }}' },
      { label: 'Total Duty', value: '{{ totalDuty }} {{ currency }}' },
    ] },
    { id: 'sig', type: 'signature', title: 'Declarant Signature' },
  ],
  signature: signature(['declarant']),
  qr: { enabled: true, contentTemplate: 'CUS|{{ declarationNumber }}|{{ totalCustomsValue }}|{{ hash }}' },
};

export interface TradeDocumentDef {
  type: string;
  title: string;
  /** The data field that carries the document's human-facing number. */
  numberField: string;
  template: DocumentTemplate;
}

export const TRADE_DOCUMENT_TEMPLATES: Readonly<Record<string, TradeDocumentDef>> = {
  COMMERCIAL_INVOICE: { type: 'COMMERCIAL_INVOICE', title: 'Commercial Invoice', numberField: 'invoiceNumber', template: commercialInvoice },
  PACKING_LIST: { type: 'PACKING_LIST', title: 'Packing List', numberField: 'packingListNumber', template: packingList },
  BILL_OF_LADING: { type: 'BILL_OF_LADING', title: 'Bill of Lading', numberField: 'blNumber', template: billOfLading },
  CERTIFICATE_OF_ORIGIN: { type: 'CERTIFICATE_OF_ORIGIN', title: 'Certificate of Origin', numberField: 'cooNumber', template: certificateOfOrigin },
  CUSTOMS_DECLARATION: { type: 'CUSTOMS_DECLARATION', title: 'Customs Declaration', numberField: 'declarationNumber', template: customsDeclaration },
};

export function getTradeDocumentDef(type: string): TradeDocumentDef | null {
  return TRADE_DOCUMENT_TEMPLATES[type] ?? null;
}

export function listTradeDocumentTypes(): { type: string; title: string; outputFormats: string[] }[] {
  return Object.values(TRADE_DOCUMENT_TEMPLATES).map((d) => ({
    type: d.type,
    title: d.title,
    outputFormats: d.template.outputFormats ?? ['PDF'],
  }));
}
