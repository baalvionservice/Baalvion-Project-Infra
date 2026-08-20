import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Per-article "Important" callout, distinct from the homepage-only
 * HomepageDisclaimer -- shown on every guide, right after the metadata
 * header and before the reader reaches any sourced claims. A true statement
 * about every piece of content on the network, so it always renders (see
 * /editorial-process for the fuller policy this summarizes).
 */
export function ImportantNotice() {
  return (
    <div className="flex items-start gap-3 text-[13.5px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-5 py-4">
      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-bold">Important: </span>
        This article provides general legal information and does not constitute legal advice.
        Consult a licensed attorney in your jurisdiction for guidance on your specific situation.
      </p>
    </div>
  );
}
