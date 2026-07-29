/**
 * @file server/documents/__tests__/document-generator.test.ts
 * @description Unit tests for trade-document generation across all five templates:
 * validation, rendering, deterministic hashing. No I/O.
 */
import { describe, it, expect } from 'vitest';
import { generateDocument } from '../document-generator';
import { listTradeDocumentTypes } from '../trade-document-templates';

const party = (name: string, country: string) => ({ name, address: '1 Trade Way', country, taxId: `${country}123` });
const NOW = '2026-06-22T00:00:00.000Z';

const invoiceData = {
  invoiceNumber: 'INV-1001',
  issueDate: '2026-06-22',
  currency: 'USD',
  incoterm: 'FOB',
  seller: party('Acme Exports', 'US'),
  buyer: party('Globex Imports', 'DE'),
  items: [{ description: 'Steel coils', hsCode: '7208.10', quantity: 10, unitPrice: 500, lineTotal: 5000 }],
  subtotal: 5000,
  taxTotal: 0,
  grandTotal: 5000,
  paymentTerms: 'NET 30',
};

const packingData = {
  packingListNumber: 'PKL-1',
  issueDate: '2026-06-22',
  seller: party('Acme Exports', 'US'),
  buyer: party('Globex Imports', 'DE'),
  packages: [{ marks: 'M1', description: 'Crate', quantity: 5, netWeight: 100, grossWeight: 120, dimensions: '1x1x1' }],
  totalPackages: 1,
  totalNetWeight: 100,
  totalGrossWeight: 120,
};

const blData = {
  blNumber: 'BL-7',
  issueDate: '2026-06-22',
  shipper: party('Acme Exports', 'US'),
  consignee: party('Globex Imports', 'DE'),
  vessel: 'MV Trade',
  voyageNo: 'V1',
  portOfLoading: 'Shanghai',
  portOfDischarge: 'Hamburg',
  containers: [{ containerNo: 'MSCU1234567', sealNo: 'S1', packages: 5, description: 'Steel coils', grossWeight: 1000 }],
  freightTerms: 'PREPAID',
  numberOfOriginals: 3,
};

const cooData = {
  cooNumber: 'COO-3',
  issueDate: '2026-06-22',
  exporter: party('Acme Exports', 'US'),
  consignee: party('Globex Imports', 'DE'),
  countryOfOrigin: 'US',
  transportDetails: 'Sea freight',
  items: [{ marks: 'M', description: 'Steel coils', hsCode: '7208.10', originCriterion: 'WO', quantity: 10 }],
  declaration: 'We hereby certify the origin.',
  chamberOfCommerce: 'NY Chamber',
};

const customsData = {
  declarationNumber: 'CUS-9',
  declarationDate: '2026-06-22',
  regime: 'EXPORT',
  declarant: party('Acme Customs Broker', 'US'),
  exporter: party('Acme Exports', 'US'),
  importer: party('Globex Imports', 'DE'),
  customsOffice: 'NY-Port',
  countryOfOrigin: 'US',
  countryOfDestination: 'DE',
  items: [{ hsCode: '7208.10', description: 'Steel coils', quantity: 10, customsValue: 5000, dutyRate: '5%' }],
  totalCustomsValue: 5000,
  totalDuty: 250,
  currency: 'USD',
};

const insuranceData = {
  certificateNumber: 'INS-1',
  issueDate: '2026-06-22',
  insurer: party('Global Marine Insurance', 'GB'),
  insured: party('Acme Exports', 'US'),
  policyNumber: 'POL-555',
  conveyance: 'MV Trade',
  voyageFrom: 'Shanghai',
  voyageTo: 'Hamburg',
  goods: [{ description: 'Steel coils', marks: 'M1', quantity: 10, value: 5000 }],
  insuredValue: 5500,
  currency: 'USD',
  coveredRisks: 'All Risks (Institute Cargo Clauses A)',
  claimsPayableAt: 'Hamburg',
};

const purchaseOrderData = {
  poNumber: 'PO-88',
  issueDate: '2026-06-22',
  buyer: party('Globex Imports', 'DE'),
  seller: party('Acme Exports', 'US'),
  deliveryDate: '2026-07-01',
  incoterm: 'FOB',
  currency: 'USD',
  items: [{ description: 'Steel coils', hsCode: '7208.10', quantity: 10, unitPrice: 500, lineTotal: 5000 }],
  subtotal: 5000,
  grandTotal: 5000,
  paymentTerms: 'NET 30',
  specialInstructions: 'Handle with care',
};

const letterOfCreditData = {
  lcNumber: 'LC-42',
  issueDate: '2026-06-22',
  expiryDate: '2026-09-22',
  issuingBank: party('First National Bank', 'US'),
  applicant: party('Globex Imports', 'DE'),
  beneficiary: party('Acme Exports', 'US'),
  amount: 5000,
  currency: 'USD',
  availableWith: 'Issuing Bank by payment',
  partialShipments: false,
  transhipment: false,
  latestShipmentDate: '2026-08-15',
  documentsRequired: ['Commercial Invoice', 'Bill of Lading', 'Certificate of Origin'],
  descriptionOfGoods: 'Steel coils, 10 MT',
};

const inspectionData = {
  certificateNumber: 'INSP-5',
  inspectionDate: '2026-06-22',
  inspectionBody: party('SGS Testing', 'CH'),
  exporter: party('Acme Exports', 'US'),
  consignee: party('Globex Imports', 'DE'),
  placeOfInspection: 'Shanghai Port',
  items: [{ description: 'Steel coils', hsCode: '7208.10', quantity: 10, finding: 'Conforms to spec' }],
  inspectionStandard: 'ISO 17020',
  result: 'PASS',
  remarks: 'No defects found',
};

describe('trade-document template registry', () => {
  it('exposes all nine document types', () => {
    const types = listTradeDocumentTypes().map((t) => t.type);
    expect(types).toEqual(
      expect.arrayContaining([
        'COMMERCIAL_INVOICE', 'PACKING_LIST', 'BILL_OF_LADING', 'CERTIFICATE_OF_ORIGIN', 'CUSTOMS_DECLARATION',
        'INSURANCE_CERTIFICATE', 'PURCHASE_ORDER', 'LETTER_OF_CREDIT', 'INSPECTION_CERTIFICATE',
      ]),
    );
  });
});

describe('generateDocument — happy path per template', () => {
  const cases: [string, Record<string, unknown>, string, string][] = [
    ['COMMERCIAL_INVOICE', invoiceData, 'INV-1001', 'Steel coils'],
    ['PACKING_LIST', packingData, 'PKL-1', 'Crate'],
    ['BILL_OF_LADING', blData, 'BL-7', 'MSCU1234567'],
    ['CERTIFICATE_OF_ORIGIN', cooData, 'COO-3', 'WO'],
    ['CUSTOMS_DECLARATION', customsData, 'CUS-9', 'EXPORT'],
    ['INSURANCE_CERTIFICATE', insuranceData, 'INS-1', 'Steel coils'],
    ['PURCHASE_ORDER', purchaseOrderData, 'PO-88', 'Steel coils'],
    ['LETTER_OF_CREDIT', letterOfCreditData, 'LC-42', 'Commercial Invoice'],
    ['INSPECTION_CERTIFICATE', inspectionData, 'INSP-5', 'Conforms to spec'],
  ];

  for (const [type, data, number, marker] of cases) {
    it(`generates a ${type}`, () => {
      const doc = generateDocument({ documentType: type, data, format: 'HTML' }, { now: NOW });
      expect(doc.documentType).toBe(type);
      expect(doc.documentNumber).toBe(number);
      expect(doc.content).toContain(number);
      expect(doc.content).toContain(marker);
      expect(doc.hash).toMatch(/^[a-f0-9]{64}$/);
      expect(doc.generatedAt).toBe(NOW);
    });
  }
});

describe('generateDocument — validation & determinism', () => {
  it('throws on an unknown document type', () => {
    expect(() => generateDocument({ documentType: 'NOT_A_DOC', data: {} })).toThrow(/UNKNOWN_DOCUMENT_TYPE/);
  });

  it('throws when a required field is missing', () => {
    const { invoiceNumber, ...withoutNumber } = invoiceData;
    expect(() => generateDocument({ documentType: 'COMMERCIAL_INVOICE', data: withoutNumber })).toThrow(/DOCUMENT_VALIDATION_FAILED/);
  });

  it('throws when a repeating section is empty', () => {
    expect(() => generateDocument({ documentType: 'COMMERCIAL_INVOICE', data: { ...invoiceData, items: [] } })).toThrow(
      /DOCUMENT_VALIDATION_FAILED/,
    );
  });

  it('rejects an invalid customs regime via the in-rule', () => {
    expect(() => generateDocument({ documentType: 'CUSTOMS_DECLARATION', data: { ...customsData, regime: 'SMUGGLE' } })).toThrow(
      /DOCUMENT_VALIDATION_FAILED/,
    );
  });

  it('rejects an invalid inspection result via the in-rule', () => {
    expect(() => generateDocument({ documentType: 'INSPECTION_CERTIFICATE', data: { ...inspectionData, result: 'MAYBE' } })).toThrow(
      /DOCUMENT_VALIDATION_FAILED/,
    );
  });

  it('throws when a letter of credit has no required documents listed', () => {
    expect(() =>
      generateDocument({ documentType: 'LETTER_OF_CREDIT', data: { ...letterOfCreditData, documentsRequired: [] } }),
    ).toThrow(/DOCUMENT_VALIDATION_FAILED/);
  });

  it('produces a stable content hash for identical data', () => {
    const a = generateDocument({ documentType: 'COMMERCIAL_INVOICE', data: invoiceData }, { now: NOW });
    const b = generateDocument({ documentType: 'COMMERCIAL_INVOICE', data: invoiceData }, { now: '2030-01-01T00:00:00.000Z' });
    expect(a.hash).toBe(b.hash); // hash excludes the timestamp
  });

  it('changes the hash when the data changes', () => {
    const a = generateDocument({ documentType: 'COMMERCIAL_INVOICE', data: invoiceData });
    const b = generateDocument({ documentType: 'COMMERCIAL_INVOICE', data: { ...invoiceData, grandTotal: 9999 } });
    expect(a.hash).not.toBe(b.hash);
  });

  it('emits structured JSON when asked', () => {
    const doc = generateDocument({ documentType: 'COMMERCIAL_INVOICE', data: invoiceData, format: 'JSON' });
    expect(doc.format).toBe('JSON');
    expect(() => JSON.parse(doc.content)).not.toThrow();
  });
});
