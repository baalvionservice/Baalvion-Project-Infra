'use client';

import { useState, useEffect } from 'react';
import ComplianceOverview from './components/compliance-overview';
import CountryComplianceTable from './components/country-compliance-table';
import UpcomingDeadlines from './components/upcoming-deadlines';
import ComplianceDetailModal from './components/compliance-detail-modal';
import { dashboardApi } from '@/lib/api-client';
import type { ComplianceRecord } from '@/lib/types';

// Country → flag (compliance_records has no country_code; map common ones, default globe).
const FLAGS: Record<string, string> = {
  'United Arab Emirates': '🇦🇪', Singapore: '🇸🇬', India: '🇮🇳',
  'United Kingdom': '🇬🇧', France: '🇫🇷', 'United States': '🇺🇸',
};

// Map a dashboard-service compliance_records row (snake_case + joined business) to the
// ComplianceRecord shape the components expect.
function toRecord(r: Record<string, unknown>): ComplianceRecord {
  const business = r.business as { name?: string } | undefined;
  const country = String(r.country ?? '');
  return {
    countryId: String(r.country_id ?? ''),
    country,
    business: business?.name ?? '—',
    flag: FLAGS[country] ?? '🌐',
    taxStatus: String(r.tax_status ?? ''),
    taxStatusCode: r.tax_status_code === 'warning' ? 'warning' : 'ok',
    vatGst: String(r.vat_gst ?? ''),
    licenses: String(r.licenses ?? ''),
    dataLaws: String(r.data_laws ?? ''),
    employmentLaw: String(r.employment_law ?? ''),
    overallScore: Number(r.overall_score ?? 0),
    actionItems: Array.isArray(r.action_items) ? (r.action_items as string[]) : [],
  };
}

export default function CompliancePage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await dashboardApi.compliance();
        const rows = (Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? []) as Record<string, unknown>[];
        if (!cancelled) setRecords(rows.map(toRecord));
      } catch {
        if (!cancelled) setRecords([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
        <p className="text-muted-foreground">
          Monitor and manage your global compliance status.{' '}
          {loading ? '(loading…)' : `(${records.length} live records)`}
        </p>
      </div>

      <ComplianceOverview complianceData={records} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CountryComplianceTable complianceData={records} onSelectRecord={setSelectedRecord} />
        </div>
        <div className="lg:col-span-1">
          <UpcomingDeadlines />
        </div>
      </div>

      <ComplianceDetailModal
        record={selectedRecord}
        isOpen={!!selectedRecord}
        onOpenChange={() => setSelectedRecord(null)}
      />
    </div>
  );
}
