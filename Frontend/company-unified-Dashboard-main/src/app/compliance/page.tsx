'use client';

import { useState } from 'react';
import ComplianceOverview from './components/compliance-overview';
import CountryComplianceTable from './components/country-compliance-table';
import UpcomingDeadlines from './components/upcoming-deadlines';
import ComplianceDetailModal from './components/compliance-detail-modal';
import complianceData from '@/lib/data/compliance.json';
import type { ComplianceRecord } from '@/lib/types';

export default function CompliancePage() {
    const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
                <p className="text-muted-foreground">
                    Monitor and manage your global compliance status.
                </p>
            </div>
            
            <ComplianceOverview complianceData={complianceData as ComplianceRecord[]} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <CountryComplianceTable 
                        complianceData={complianceData as ComplianceRecord[]} 
                        onSelectRecord={setSelectedRecord}
                    />
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
