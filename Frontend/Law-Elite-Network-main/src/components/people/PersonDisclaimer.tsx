import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Shown on the /people hub and every profile — the same non-affiliation
 * guardrail the network already applies to its legal-figures concept
 * (never implying a hire-a-lawyer directory or an endorsement), generalized
 * to every category now covered: nobody profiled here is affiliated with,
 * represented by, or contactable through Law Elite Network.
 */
export function PersonDisclaimer() {
  return (
    <div className="flex items-start gap-3 text-[13.5px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-5 py-4">
      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-bold">Independent reference profiles: </span>
        People featured here are not affiliated with, represented by, or contactable through Law Elite Network.
        Profiles are general, independently compiled biographical information, not an endorsement, directory
        listing, or solicitation on behalf of anyone named.
      </p>
    </div>
  );
}
