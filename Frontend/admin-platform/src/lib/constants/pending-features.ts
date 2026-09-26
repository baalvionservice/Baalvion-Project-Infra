// Internal backlog of features that have been scoped/discussed but not built yet.
// Not backed by a database — this is a short, hand-maintained list of what's queued,
// edited directly here (by Claude or a dev) as items are added, started, or shipped.
// Keep it short: this is "what's actually next," not a wishlist.

export type PendingFeatureStatus = 'planned' | 'scoped' | 'in-progress';

export interface PendingFeature {
  id: string;
  title: string;
  description: string;
  sites: string[];
  status: PendingFeatureStatus;
  estimate?: string;
  addedDate: string; // ISO date
  notes?: string;
}

export const PENDING_FEATURES: PendingFeature[] = [
  {
    id: 'pdf-word-bulk-article-import',
    title: 'Bulk article import from PDF / Word files',
    description:
      'Upload PDF or .docx files in the CMS content importer; each file is text-extracted and ' +
      'created as a draft article (title/excerpt/paragraph blocks guessed from the extracted text), ' +
      'then published individually or in bulk from the existing content list — same draft-then-publish ' +
      'flow the CMS already uses for pasted JSON/CSV bulk import.',
    sites: ['Law Elite Network', 'Imperialpedia'],
    status: 'scoped',
    estimate: '1.5–3 hours for digital (text-selectable) PDFs/Word docs, using mammoth (.docx) + ' +
      'pdfjs-dist (.pdf). Scanned/image PDFs would need OCR (Tesseract.js) on top — slower and ' +
      'meaningfully less reliable; treat as a separate, larger estimate if any source files are scans.',
    addedDate: '2026-09-18',
    notes:
      'Formatting fidelity will be rough for tables/multi-column layouts/footnotes either way — ' +
      'those need manual cleanup after import. Plain single-column article text extracts well.',
  },
];
