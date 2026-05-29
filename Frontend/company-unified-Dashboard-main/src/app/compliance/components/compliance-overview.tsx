'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, Shield, FileText, AlertTriangle, Globe } from 'lucide-react';
import { CircularProgress } from '@/components/ui/circular-progress';
import type { ComplianceRecord } from '@/lib/types';

interface ComplianceOverviewProps {
  complianceData: ComplianceRecord[];
}

export default function ComplianceOverview({ complianceData }: ComplianceOverviewProps) {
  // Guard against divide-by-zero when there are no records yet (would yield NaN → React warning + bad UI).
  const overallScore = complianceData.length
    ? Math.round(complianceData.reduce((acc, c) => acc + c.overallScore, 0) / complianceData.length)
    : 0;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(overallScore), 150);
    return () => clearTimeout(timer);
  }, [overallScore]);
  
  const taxCompliantCount = complianceData.filter(c => c.taxStatusCode === 'ok').length;
  const dataResidencyNeedsReview = complianceData.some(c => c.dataLaws.includes('Review'));

  const stats = [
    { title: 'Tax Compliant', value: `${taxCompliantCount}/${complianceData.length}`, icon: CheckCircle, status: taxCompliantCount === complianceData.length ? 'ok' : 'warning' },
    { title: 'GDPR', value: 'Compliant', icon: Shield, status: 'ok' },
    { title: 'Data Residency', value: dataResidencyNeedsReview ? 'Review Needed' : 'Compliant', icon: Globe, status: dataResidencyNeedsReview ? 'warning' : 'ok' },
    { title: 'Licenses', value: 'All Valid', icon: FileText, status: 'ok' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card className="md:col-span-1 flex flex-col items-center justify-center p-6">
        <div className="relative h-24 w-24 mb-2">
          <CircularProgress value={progress} strokeWidth={8} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{overallScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
        <p className="text-sm font-medium text-center">Overall Compliance Score</p>
      </Card>
      <div className="md:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.status === 'ok' ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> :
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              }
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
