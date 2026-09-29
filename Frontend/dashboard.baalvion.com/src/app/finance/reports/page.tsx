'use client';

import { useState } from 'react';
import ReportSelector from './components/report-selector';
import ReportPreview from './components/report-preview';
import RecentReports from './components/recent-reports';

export type ReportType =
  | 'pnl'
  | 'executive'
  | 'annual'
  | 'investor'
  | 'tax'
  | 'custom';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Generate, preview, and export financial reports.
        </p>
      </div>

      {!selectedReport ? (
        <ReportSelector onSelectReport={setSelectedReport} />
      ) : (
        <ReportPreview
          reportType={selectedReport}
          onBack={() => setSelectedReport(null)}
        />
      )}

      <RecentReports />
    </div>
  );
}
