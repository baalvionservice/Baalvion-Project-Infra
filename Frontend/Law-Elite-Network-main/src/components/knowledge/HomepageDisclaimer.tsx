import React from 'react';
import Link from 'next/link';

/**
 * Small, unobtrusive homepage disclaimer -- sits above the footer. The full
 * disclaimer (no-attorney-client-relationship + liability limitation) lives
 * on /terms-of-service; this links straight to that section rather than
 * restating it.
 */
export function HomepageDisclaimer() {
  return (
    <div className="py-8 border-t border-slate-100">
      <p className="text-[12.5px] text-slate-400 leading-relaxed max-w-3xl">
        Law Elite Network provides general legal information for educational and research purposes.
        Laws and regulations can change and may differ between jurisdictions. Information on this
        website should not be treated as individualized legal advice or a substitute for
        consultation with a qualified legal professional. Read the full{' '}
        <Link href="/terms-of-service#disclaimers" className="text-slate-500 underline hover:text-news-600">
          Legal Disclaimer
        </Link>
        .
      </p>
    </div>
  );
}
