/**
 * @file logistics-shipment/iot-monitoring/page.tsx
 * @description IoT Sensor Monitoring — device registry with live status/battery and recent readings.
 */
'use client';

import { useState } from 'react';
import { Loader2, Thermometer, Droplets, Battery, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIotDevices, useIotReadings } from '@/api/tracking-platform';

const DEVICE_ICON: Record<string, typeof Thermometer> = {
  temperature: Thermometer, humidity: Droplets, battery: Battery,
};

export default function IotMonitoringPage() {
  const { data, isLoading } = useIotDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const { data: readings } = useIotReadings(selectedDeviceId || '');

  return (
    <main className="space-y-8 pb-24">
      <div className="border-b pb-8 space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Shipment Tracking Platform</p>
        <h2 className="text-4xl font-black tracking-tighter uppercase">IoT Sensor Monitoring.</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card className="shadow-none border-2 rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6"><CardTitle className="text-lg font-black uppercase tracking-tighter">Devices</CardTitle></CardHeader>
            <CardContent className="p-0 divide-y">
              {isLoading && <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}
              {!isLoading && (data?.items || []).length === 0 && <p className="p-12 text-center text-xs font-bold uppercase text-muted-foreground">No IoT devices registered</p>}
              {(data?.items || []).map((device) => {
                const Icon = DEVICE_ICON[device.deviceType] || Wifi;
                return (
                  <button key={device.id} className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/20 transition-colors" onClick={() => setSelectedDeviceId(device.id)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-muted border-2 flex items-center justify-center"><Icon className="h-5 w-5 text-primary opacity-70" /></div>
                      <div>
                        <p className="font-black uppercase tracking-tight text-sm">{device.deviceType} • {device.externalDeviceId || device.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{device.shipmentId ? `Shipment ${device.shipmentId.slice(0, 8)}` : 'Unassigned'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {device.batteryPct != null && <span className="text-[10px] font-black">{device.batteryPct}%</span>}
                      {device.status === 'online' ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="shadow-none border-2 rounded-2xl overflow-hidden h-full">
            <CardHeader className="bg-muted/10 border-b p-6"><CardTitle className="text-sm font-black uppercase tracking-tighter">Recent Readings</CardTitle></CardHeader>
            <CardContent className="p-0 divide-y max-h-[500px] overflow-auto">
              {!selectedDeviceId && <p className="p-8 text-center text-xs font-bold uppercase text-muted-foreground">Select a device</p>}
              {selectedDeviceId && (readings?.items || []).length === 0 && <p className="p-8 text-center text-xs font-bold uppercase text-muted-foreground">No readings yet</p>}
              {(readings?.items || []).map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase">{r.metricType}</p>
                    <p className="text-[9px] text-muted-foreground">{new Date(r.recordedAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black">{r.value} {r.unit}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
