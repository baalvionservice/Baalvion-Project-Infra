
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  FileBarChart2,
  Users,
  BookOpenCheck,
} from 'lucide-react';
import RecentReportsTable from './recent-reports-table';
import type { ReportType } from '../page';

interface ReportDashboardProps {
  onSelectReport: (type: ReportType) => void;
}

const quickActions = [
  {
    type: 'weekly',
    title: 'Weekly Summary',
    icon: Calendar,
    description: 'A quick overview of last week\'s performance.',
  },
  {
    type: 'pnl',
    title: 'Monthly P&L',
    icon: FileBarChart2,
    description: 'A detailed profit and loss statement for last month.',
  },
  {
    type: 'investor-update',
    title: 'Investor Update',
    icon: Users,
    description: 'A comprehensive report for your investors.',
  },
  {
    type: 'annual',
    title: 'Annual Review',
    icon: BookOpenCheck,
    description: 'A full review of the company\'s performance.',
  },
];

export default function ReportDashboard({ onSelectReport }: ReportDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Reports</h1>
        <p className="text-muted-foreground">
          Generate, schedule, and review high-level business reports.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Card
            key={action.type}
            className="cursor-pointer hover:bg-muted/50 transition-colors flex flex-col"
            onClick={() => onSelectReport(action.type as ReportType)}
          >
            <CardHeader>
              <div className="flex items-center gap-4">
                <action.icon className="h-8 w-8 text-primary" />
                <CardTitle>{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{action.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Report Scheduling</CardTitle>
              <CardDescription>
                Automate report generation and delivery.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">
                    Every Monday @ 8am to arjun@baalvion.com
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <Label>Monthly P&L</Label>
                  <p className="text-sm text-muted-foreground">
                    1st of month to team@baalvion.com,...
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <Label>Quarterly Review</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-generate in documents.
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
            <RecentReportsTable />
        </div>
      </div>
    </div>
  );
}
