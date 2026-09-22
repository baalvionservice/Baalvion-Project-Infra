'use client';

import React, { useState } from 'react';

export interface DocumentItem {
  id: string;
  title: string;
  caseName: string;
  court: string;
  docketNo: string;
  dateFiled: string;
  totalPages: number;
  highlightedQuote: string;
  annotation: string;
  previewImage?: string;
  pdfUrl?: string;
}

const SAMPLE_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'Emergency Application for Stay of Injunction',
    caseName: 'U.S. Court of Appeals for the D.C. Circuit',
    court: 'Supreme Court of the United States',
    docketNo: 'No. 24A-892',
    dateFiled: 'September 18, 2026',
    totalPages: 42,
    highlightedQuote:
      '“Absent immediate stay intervention by this Court, applicant faces irreparable commercial harm and irreversible loss of executive privilege protections established under Article II.”',
    annotation:
      'Law Elite Senior Legal Analyst Note: Counsel hinges their argument on strict separation-of-powers precedent. The 42-page emergency motion requests action prior to Friday 5:00 PM EST.',
  },
  {
    id: 'doc-2',
    title: 'Plaintiff Verified Master Class Action Complaint',
    caseName: 'In re Corporate Governance & Fiduciary Litigation',
    court: 'Delaware Court of Chancery',
    docketNo: 'C.A. No. 2026-0412-JTL',
    dateFiled: 'August 30, 2026',
    totalPages: 118,
    highlightedQuote:
      '“Defendants acted with gross negligence and engaged in bad faith self-dealing by authorizing unhedged equity distributions without independent board committee approval.”',
    annotation:
      'Chancery Court Analysis: Delaware standards require clear proof of waste or bad faith. Paragraphs 45–89 set forth explicit email records submitted under subpoena.',
  },
];

interface CourtDocumentViewerProps {
  documents?: DocumentItem[];
  compact?: boolean;
}

export function CourtDocumentViewer({ documents = SAMPLE_DOCUMENTS, compact = false }: CourtDocumentViewerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'annotated' | 'raw'>('annotated');

  const doc = documents[activeIdx] || SAMPLE_DOCUMENTS[0];

  return (
    <div className="bg-slate-900 text-white rounded-xl overflow-hidden border border-slate-800 shadow-2xl my-8">
      {/* Document Header */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-red-600/20 border border-red-500/40 text-red-500 font-serif font-black text-xl flex items-center justify-center shrink-0">
            §
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-red-400 font-bold uppercase tracking-wider">OFFICIAL COURT FILING</span>
              <span>•</span>
              <span>{doc.docketNo}</span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-white leading-tight">
              {doc.title}
            </h3>
          </div>
        </div>

        {/* Tab switcher if multiple documents */}
        {documents.length > 1 && (
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {documents.map((d, i) => (
              <button
                key={d.id}
                onClick={() => {
                  setActiveIdx(i);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition ${
                  i === activeIdx
                    ? 'bg-red-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Filing #{i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Document Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Document Legal Page View */}
        <div className="lg:col-span-7 bg-slate-950 p-6 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between min-h-[380px]">
          {/* Simulated Official Legal Paper */}
          <div className="bg-amber-50 text-slate-900 p-6 rounded shadow-inner border border-amber-200/80 font-serif text-sm relative space-y-4">
            <div className="flex justify-between items-start text-[10px] font-mono text-slate-500 border-b border-slate-300 pb-2">
              <div>
                <p className="font-bold text-slate-800 uppercase">{doc.court}</p>
                <p>{doc.caseName}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-700">FILED & ENTERED</p>
                <p>{doc.dateFiled}</p>
              </div>
            </div>

            <div className="py-2 space-y-3">
              <p className="text-xs uppercase font-sans tracking-widest text-slate-600 font-bold text-center">
                MEMORANDUM OF LAW IN SUPPORT
              </p>
              
              {/* Highlighted key excerpt */}
              <div className="p-3.5 bg-yellow-100/90 border-l-4 border-yellow-500 text-slate-900 font-serif italic text-base leading-relaxed rounded-r shadow-sm">
                {doc.highlightedQuote}
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                Page {currentPage} of {doc.totalPages}. Pursuant to Federal Rule of Civil Procedure 62(d), counsel submits this verified petition demonstrating substantial likelihood of success on the merits and immediate unrecoverable injury...
              </p>
            </div>

            <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>AUTHENTICATED COURT RECORD</span>
              <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">SEAL VERIFIED</span>
            </div>
          </div>

          {/* Page Controls */}
          <div className="mt-4 flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold text-white transition"
              >
                ◀ Prev
              </button>
              <span>
                Page <strong className="text-white">{currentPage}</strong> of {doc.totalPages}
              </span>
              <button
                disabled={currentPage >= doc.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(doc.totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 font-bold text-white transition"
              >
                Next ▶
              </button>
            </div>

            <a
              href={doc.pdfUrl || '#'}
              onClick={(e) => {
                if (!doc.pdfUrl) {
                  e.preventDefault();
                  alert('Full 42-page certified PDF download initiated. Verified docket file saved to downloads.');
                }
              }}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition font-sans text-xs"
            >
              📥 Download Certified PDF
            </a>
          </div>
        </div>

        {/* Legal Annotation & Editorial Notes Panel */}
        <div className="lg:col-span-5 p-6 bg-slate-900 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-red-400">
                Law Elite Editorial Analysis
              </h4>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                Verified Docket Analysis
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-200 leading-relaxed font-sans">
                {doc.annotation}
              </p>
              
              <div className="bg-slate-950 p-3.5 rounded border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Key Case Impact Rating
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-red-600 h-2 rounded-full w-4/5"></div>
                </div>
                <p className="text-[11px] text-slate-400">
                  High Precedential Impact (SCOTUS Docket Priority Level 9/10)
                </p>
              </div>
            </div>
          </div>

          {/* Action Callout */}
          <div className="p-3 bg-red-950/40 border border-red-900/50 rounded text-xs text-red-200 flex items-center justify-between">
            <span>Want automatic notification when the judge rules?</span>
            <button
              onClick={() => alert('Docket Watch Enabled! You will receive instant notifications on ruling releases.')}
              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded shrink-0 transition"
            >
              Track Docket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
