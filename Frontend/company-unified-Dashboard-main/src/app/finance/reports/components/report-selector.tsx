import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Briefcase, Landmark, User, FileBarChart2, CalendarRange } from 'lucide-react';
import type { ReportType } from '../page';

interface ReportSelectorProps {
  onSelectReport: (reportType: ReportType) => void;
}

const reportTypes = [
  { id: 'pnl', title: 'Monthly P&L Report', icon: FileBarChart2, description: 'Detailed profit and loss statement.' },
  { id: 'executive', title: 'Quarterly Executive Summary', icon: Briefcase, description: 'High-level overview for leadership.' },
  { id: 'annual', title: 'Annual Financial Statement', icon: Landmark, description: 'Official year-end financial summary.' },
  { id: 'investor', title: 'Investor Report', icon: User, description: 'Performance data tailored for investors.' },
  { id: 'tax', title: 'Tax Summary', icon: FileText, description: 'Data required for tax filings.' },
  { id: 'custom', title: 'Custom Date Range', icon: CalendarRange, description: 'Generate a report for a specific period.' },
] as const;

export default function ReportSelector({ onSelectReport }: ReportSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Report Type</CardTitle>
        <CardDescription>Choose a template to start generating your report.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onSelectReport(report.id)}
          >
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
              <div className="p-3 rounded-lg bg-muted">
                <report.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription className="mt-1">{report.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
