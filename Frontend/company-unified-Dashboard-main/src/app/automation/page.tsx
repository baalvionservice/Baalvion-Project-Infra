'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  PlayCircle,
  CalendarClock,
  Webhook,
  AlertTriangle,
} from 'lucide-react';
import CronJobsTable from './components/cron-jobs-table';
import WebhookLogViewer from './components/webhook-log-viewer';
import JsonViewerModal from './components/json-viewer-modal';
import cronJobs from '@/lib/data/cron-jobs.json';
import webhooks from '@/lib/data/webhooks.json';

export default function AutomationPage() {
  const [selectedPayload, setSelectedPayload] = useState<string | null>(null);

  const summaryCards = [
    { title: 'Jobs Running', value: cronJobs.filter(j => j.status === 'Running').length, icon: PlayCircle },
    { title: 'Jobs Scheduled', value: cronJobs.length, icon: CalendarClock },
    { title: 'Webhooks Today', value: 48, icon: Webhook },
    { title: 'Failed Events', value: webhooks.filter(w => w.status === 'Failed').length, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Automation & Webhooks
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage your automated tasks and webhooks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <CronJobsTable />
      <WebhookLogViewer onViewPayload={setSelectedPayload} />

      <JsonViewerModal
        payload={selectedPayload}
        isOpen={!!selectedPayload}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedPayload(null);
          }
        }}
      />
    </div>
  );
}
