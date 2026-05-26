
'use client';

import { useState } from 'react';
import ReportDashboard from './components/report-dashboard';
import InvestorUpdatePreview from './components/investor-update-preview';
import { useToast } from '@/hooks/use-toast';

export type ReportType = 'weekly' | 'pnl' | 'investor-update' | 'annual';

export default function ExecutiveReportsPage() {
  const [view, setView] = useState<ReportType | 'dashboard'>('dashboard');
  const { toast } = useToast();

  const handleSelectReport = (type: ReportType) => {
    if (type === 'investor-update') {
      setView(type);
    } else {
      toast({
        title: 'Generating Report...',
        description: `Your ${type.replace('-', ' ')} report is being generated and will be available shortly.`,
      });
    }
  };
  
  if (view === 'investor-update') {
    return <InvestorUpdatePreview onBack={() => setView('dashboard')} />;
  }

  return <ReportDashboard onSelectReport={handleSelectReport} />;
}
