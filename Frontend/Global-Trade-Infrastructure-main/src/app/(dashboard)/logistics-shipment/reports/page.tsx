/**
 * @file logistics-shipment/reports/page.tsx
 * @description Tracking Reports — CSV export links for delay/carrier/geofence/ETA/tracking-history
 * reports. Downloads go through the same-origin /trade-bff proxy so gateway auth headers apply.
 */
'use client';

import { FileDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const REPORTS = [
  { key: 'delay', label: 'Delay Report', path: '/trade-bff/tracking_reports/delay' },
  { key: 'carrier', label: 'Carrier Report', path: '/trade-bff/tracking_reports/carrier' },
  { key: 'geofence', label: 'Geofence Report', path: '/trade-bff/tracking_reports/geofence' },
  { key: 'eta', label: 'ETA Report', path: '/trade-bff/tracking_reports/eta' },
];

export default function TrackingReportsPage() {
  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Shipment Tracking Platform</p>
        <h2 className="text-4xl font-black tracking-tighter uppercase">Reports.</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {REPORTS.map((report) => (
          <Card key={report.key} className="shadow-none border-2 rounded-2xl">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-black uppercase tracking-tighter">{report.label}</CardTitle></CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="font-black uppercase text-xs"
                onClick={() => window.open(`${report.path}?format=csv`, '_blank', 'noopener,noreferrer')}
              >
                <FileDown className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
