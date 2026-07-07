'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, PackageCheck, Clock, DollarSign, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FreightKpisProps {
  totalQuotes: number;
  pendingQuotes: number;
  totalBookings: number;
  activeBookings: number;
  avgTransitDays: number | null;
  monthlySpend: number;
  topCarrierName: string | null;
}

export function FreightKpis({ totalQuotes, pendingQuotes, totalBookings, activeBookings, avgTransitDays, monthlySpend, topCarrierName }: FreightKpisProps) {
  const kpis = [
    { title: 'Freight Bookings', value: totalBookings, sub: `${activeBookings} active`, icon: PackageCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending Quotes', value: pendingQuotes, sub: `${totalQuotes} total`, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Avg Transit Time', value: avgTransitDays != null ? `${avgTransitDays.toFixed(1)}d` : '—', sub: 'across active bookings', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Monthly Freight Cost', value: formatCurrency(monthlySpend), sub: 'booked this period', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Most Used Carrier', value: topCarrierName ?? '—', sub: 'by booking volume', icon: Star, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.title}</CardTitle>
            <div className={`p-2 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
