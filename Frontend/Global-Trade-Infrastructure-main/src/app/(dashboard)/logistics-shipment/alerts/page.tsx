/**
 * @file logistics-shipment/alerts/page.tsx
 * @description Full shipment alert feed with acknowledge/resolve actions.
 */
'use client';

import { useState } from 'react';
import { Loader2, Check, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShipmentAlerts, useAcknowledgeAlert, useResolveAlert } from '@/api/tracking-platform';

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-600', high: 'bg-orange-600', medium: 'bg-amber-500', low: 'bg-blue-500',
};

export default function ShipmentAlertsPage() {
  const [status, setStatus] = useState<string>('active');
  const { data: alerts, isLoading } = useShipmentAlerts(status === 'all' ? {} : { status });
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();

  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Shipment Tracking Platform</p>
        <h2 className="text-4xl font-black tracking-tighter uppercase">Alert Center.</h2>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b p-6">
          <CardTitle className="text-lg font-black uppercase tracking-tighter">Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {isLoading && <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
          {!isLoading && (alerts?.items || []).length === 0 && (
            <p className="p-12 text-center text-xs font-bold uppercase text-muted-foreground">No alerts in this view</p>
          )}
          {(alerts?.items || []).map((alert) => (
            <div key={alert.id} className="p-6 flex items-center justify-between gap-6">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-3">
                  <Badge className={`${SEVERITY_BADGE[alert.severity] || 'bg-slate-500'} text-white text-[8px] font-black h-5 px-2 border-none`}>
                    {alert.severity}
                  </Badge>
                  <span className="text-sm font-black uppercase tracking-wide">{alert.alertType.replace(/_/g, ' ')}</span>
                  <Badge variant="outline" className="text-[8px] font-black uppercase">{alert.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                <p className="text-[9px] text-muted-foreground uppercase opacity-60">Shipment {alert.shipmentId} • {new Date(alert.triggeredAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {alert.status === 'active' && (
                  <Button size="sm" variant="outline" className="text-[10px] font-black uppercase" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate(alert.id)}>
                    <Check className="h-3 w-3 mr-1" /> Ack
                  </Button>
                )}
                {alert.status !== 'resolved' && (
                  <Button size="sm" className="text-[10px] font-black uppercase" disabled={resolve.isPending} onClick={() => resolve.mutate(alert.id)}>
                    <CheckCheck className="h-3 w-3 mr-1" /> Resolve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
