'use client';

import { useEffect } from 'react';
import { Crown, Layers, Megaphone, Store, Share2, CalendarClock, LifeBuoy, Heart } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import {
  useVipClients,
  useSegments,
  useCampaigns,
  useVendors,
  useAffiliates,
  useAppointments,
  useSupportTickets,
} from '@/lib/queries/crm.queries';

const ENTITIES = [
  { key: 'vip-clients',  label: 'VIP Clients',  href: '/crm/vip-clients',  icon: Crown,         desc: 'Loyalty tiers, spend & wallet' },
  { key: 'segments',     label: 'Segments',     href: '/crm/segments',     icon: Layers,        desc: 'Audiences & churn prediction' },
  { key: 'campaigns',    label: 'Campaigns',    href: '/crm/campaigns',    icon: Megaphone,     desc: 'Promotions, reach & ROI' },
  { key: 'vendors',      label: 'Vendors',      href: '/crm/vendors',      icon: Store,         desc: 'Marketplace partner performance' },
  { key: 'affiliates',   label: 'Affiliates',   href: '/crm/affiliates',   icon: Share2,        desc: 'Referrals & commissions' },
  { key: 'appointments', label: 'Appointments', href: '/crm/appointments', icon: CalendarClock, desc: 'Boutique & concierge bookings' },
  { key: 'support-tickets', label: 'Support Tickets', href: '/crm/support-tickets', icon: LifeBuoy, desc: 'Customer service & resolution' },
] as const;

export default function CrmOverviewPage() {
  const { setBreadcrumbs } = useUIStore();

  const vipClients = useVipClients({ limit: 1 });
  const segments = useSegments({ limit: 1 });
  const campaigns = useCampaigns({ limit: 1 });
  const vendors = useVendors({ limit: 1 });
  const affiliates = useAffiliates({ limit: 1 });
  const appointments = useAppointments({ limit: 1 });
  const supportTickets = useSupportTickets({ limit: 1 });

  useEffect(() => {
    setBreadcrumbs([{ label: 'CRM & Marketing' }]);
  }, [setBreadcrumbs]);

  const counts: Record<string, { total?: number; isLoading: boolean }> = {
    'vip-clients': { total: vipClients.data?.total, isLoading: vipClients.isLoading },
    segments: { total: segments.data?.total, isLoading: segments.isLoading },
    campaigns: { total: campaigns.data?.total, isLoading: campaigns.isLoading },
    vendors: { total: vendors.data?.total, isLoading: vendors.isLoading },
    affiliates: { total: affiliates.data?.total, isLoading: affiliates.isLoading },
    appointments: { total: appointments.data?.total, isLoading: appointments.isLoading },
    'support-tickets': { total: supportTickets.data?.total, isLoading: supportTickets.isLoading },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM & Marketing"
        description="Manage Amarisé CRM — VIP clients, segments, campaigns, vendors, affiliates, appointments and support tickets"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {ENTITIES.map((e) => {
          const c = counts[e.key];
          return (
            <Card key={e.key}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{e.label}</p>
                    {c.isLoading || c.total === undefined ? (
                      <Skeleton className="h-7 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold mt-1">{c.total}</p>
                    )}
                  </div>
                  <e.icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ENTITIES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <e.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground truncate">{e.desc}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Heart className="h-3.5 w-3.5" /> Brand: Amarisé Luxe
      </p>
    </div>
  );
}
