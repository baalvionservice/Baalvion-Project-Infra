'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { ReportDialog } from './report-dialog';
import { useIdentity } from '@/lib/auth/identity-context';

/**
 * The owner's controls, plus Report for everyone else.
 *
 * Edit is offered only to the owner — and only as a link to a page the SERVER guards. A
 * hidden button is a courtesy, not a control: someone who navigates to the edit URL
 * directly still meets a 403 from the API.
 */
export function CaseActions({ caseId, isOwner, isLocked }: { caseId: string; isOwner: boolean; isLocked: boolean }) {
  const { identity } = useIdentity();
  const [reporting, setReporting] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      {isOwner && !isLocked && (
        <Link
          href={`/cases/${caseId}/edit`}
          className="focus-ring inline-flex h-9 items-center rounded-md border border-line-strong bg-surface px-3 text-sm font-medium hover:bg-surface-2"
        >
          Edit case
        </Link>
      )}
      {identity && !isOwner && (
        <Button size="sm" variant="ghost" onClick={() => setReporting(true)}>Report</Button>
      )}
      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="CASE"
        targetId={caseId}
        targetLabel="case"
      />
    </div>
  );
}
