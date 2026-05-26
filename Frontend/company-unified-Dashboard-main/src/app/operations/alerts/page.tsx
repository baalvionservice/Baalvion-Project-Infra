'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BellRing,
  AlertCircle,
  Info,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import alertsData from '@/lib/data/alerts.json';

type AlertType = 'Critical' | 'Warning' | 'Info' | 'Success';

const alertConfig: Record<
  AlertType,
  { icon: React.ElementType; color: string }
> = {
  Critical: {
    icon: AlertCircle,
    color:
      'bg-red-100 border-red-300 text-red-800 dark:bg-red-950 dark:border-red-700 dark:text-red-300 [&>svg]:text-red-800 dark:[&>svg]:text-red-300',
  },
  Warning: {
    icon: BellRing,
    color:
      'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-300 [&>svg]:text-orange-800 dark:[&>svg]:text-orange-300',
  },
  Info: {
    icon: Info,
    color:
      'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300 [&>svg]:text-blue-800 dark:[&>svg]:text-blue-300',
  },
  Success: {
    icon: CheckCircle,
    color:
      'bg-green-100 border-green-300 text-green-800 dark:bg-green-950 dark:border-green-700 dark:text-green-300 [&>svg]:text-green-800 dark:[&>svg]:text-green-300',
  },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(alertsData);
  const { toast } = useToast();

  const handleDismiss = (alertId: string) => {
    setAlerts(alerts.filter((a) => a.id !== alertId));
    toast({
      title: 'Alert Dismissed',
      description: 'The alert has been removed from your view.',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts System</h1>
          <p className="text-muted-foreground">
            Monitor, manage, and respond to important events.
          </p>
        </div>
        <Link href="/operations/alerts/rules">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Alert Rules
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>
            These items may require your attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const config = alertConfig[alert.type as AlertType];
              return (
                <Alert key={alert.id} className={cn(config.color)}>
                  <config.icon className="h-4 w-4" />
                  <AlertTitle className="font-bold">{alert.title}</AlertTitle>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{alert.timestamp}</span>
                      <div className="space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismiss(alert.id)}
                        >
                          Dismiss
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button size="sm">Take Action</Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h3 className="text-xl font-bold tracking-tight">
                All Clear!
              </h3>
              <p className="text-sm text-muted-foreground">
                You have no active alerts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
