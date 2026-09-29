'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/lib/store/uiStore';
import {
  useBillingSummary,
  useAdminSubscriptions,
  useAdminPlans,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  useCancelOrgSubscription,
  useRevenueByCustomer,
} from '@/lib/queries/admin-billing.queries';
import type { AdminPlan } from '@/lib/api/admin-billing';

const usd = (n?: number) => `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  active: 'default',
  trialing: 'secondary',
  cancelled: 'destructive',
};

type PlanForm = { id?: string; name: string; monthlyPrice: string; bandwidthLimitGb: string; features: string };

const emptyForm: PlanForm = { name: '', monthlyPrice: '', bandwidthLimitGb: '', features: '' };

export default function BillingAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => {
    setBreadcrumbs([{ label: 'Billing' }]);
  }, [setBreadcrumbs]);

  const { data: summary } = useBillingSummary();
  const { data: revenue } = useRevenueByCustomer();
  const { data: subs, isLoading: loadingSubs } = useAdminSubscriptions({ pageSize: 50 });
  const { data: plans } = useAdminPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const cancelSub = useCancelOrgSubscription();

  const [form, setForm] = useState<PlanForm | null>(null);

  const openNew = () => setForm({ ...emptyForm });
  const openEdit = (p: AdminPlan) =>
    setForm({
      id: p.id,
      name: p.name,
      monthlyPrice: String(p.monthlyPrice),
      bandwidthLimitGb: String(p.bandwidthLimitGb),
      features: (p.features || []).join(', '),
    });

  const submit = async () => {
    if (!form) return;
    const body = {
      name: form.name,
      monthlyPrice: Number(form.monthlyPrice) || 0,
      bandwidthLimitGb: Number(form.bandwidthLimitGb) || 0,
      features: form.features.split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (form.id) await updatePlan.mutateAsync({ id: form.id, body });
    else await createPlan.mutateAsync(body);
    setForm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground">Manage the plan catalog and every customer&apos;s subscription.</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Subscriptions', value: summary?.total ?? '—' },
          { label: 'Active', value: summary?.byStatus?.active ?? 0 },
          { label: 'Trialing', value: summary?.byStatus?.trialing ?? 0 },
          { label: 'Active MRR', value: `$${(summary?.activeMrr ?? 0).toLocaleString()}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue by customer */}
      <Card>
        <CardHeader><CardTitle>Revenue by Customer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: 'MRR', value: usd(revenue?.totals.mrr) },
              { label: 'ARR (projected)', value: usd(revenue?.totals.arr) },
              { label: 'Prepaid credit revenue', value: usd(revenue?.totals.creditRevenue) },
              { label: 'Total collected (lifetime)', value: usd(revenue?.totals.lifetimeRevenue) },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Customer</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium text-right">MRR</th>
                  <th className="py-2 pr-4 font-medium text-right">Credit bought</th>
                  <th className="py-2 pr-4 font-medium text-right">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                {(revenue?.customers ?? []).map((c) => (
                  <tr key={c.orgId} className="border-b">
                    <td className="py-2 pr-4 font-medium">{c.orgName}</td>
                    <td className="py-2 pr-4 capitalize">{c.planSlug}</td>
                    <td className="py-2 pr-4"><Badge variant={STATUS_VARIANT[c.status] ?? 'outline'} className="capitalize">{c.status}</Badge></td>
                    <td className="py-2 pr-4 text-right">{usd(c.mrr)}</td>
                    <td className="py-2 pr-4 text-right">{usd(c.creditPurchased)}</td>
                    <td className="py-2 pr-4 text-right font-semibold">{usd(c.lifetimeRevenue)}</td>
                  </tr>
                ))}
                {(revenue?.customers ?? []).length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">No revenue yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Plan Catalog</CardTitle>
          <Button size="sm" onClick={openNew}>New Plan</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form && (
            <div className="rounded-lg border p-4 grid gap-3 sm:grid-cols-2 bg-muted/30">
              <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Scale" /></div>
              <div className="space-y-1"><Label>Price ($/mo)</Label><Input type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} placeholder="399" /></div>
              <div className="space-y-1"><Label>Bandwidth (GB)</Label><Input type="number" value={form.bandwidthLimitGb} onChange={(e) => setForm({ ...form, bandwidthLimitGb: e.target.value })} placeholder="3000" /></div>
              <div className="space-y-1"><Label>Features (comma-sep)</Label><Input value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder="residential, datacenter" /></div>
              <div className="sm:col-span-2 flex gap-2">
                <Button size="sm" onClick={submit} disabled={!form.name || createPlan.isPending || updatePlan.isPending}>{form.id ? 'Save' : 'Create'}</Button>
                <Button size="sm" variant="outline" onClick={() => setForm(null)}>Cancel</Button>
              </div>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(plans ?? []).map((p) => (
              <div key={p.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.slug}</span>
                </div>
                <div className="text-2xl font-bold">${p.monthlyPrice}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <p className="text-xs text-muted-foreground">{p.bandwidthLimitGb} GB</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Delete plan "${p.name}"?`)) deletePlan.mutate(p.id); }}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions */}
      <Card>
        <CardHeader><CardTitle>Subscriptions</CardTitle></CardHeader>
        <CardContent>
          {loadingSubs ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Organization</th>
                    <th className="py-2 pr-4 font-medium">Plan</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">Renews</th>
                    <th className="py-2 pr-4 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {(subs?.data ?? []).map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2 pr-4 font-medium">{s.orgName}</td>
                      <td className="py-2 pr-4 capitalize">{s.planName || s.planSlug}</td>
                      <td className="py-2 pr-4"><Badge variant={STATUS_VARIANT[s.status] ?? 'outline'} className="capitalize">{s.status}</Badge></td>
                      <td className="py-2 pr-4 text-muted-foreground">{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : '—'}</td>
                      <td className="py-2 pr-4 text-right">
                        {s.status !== 'cancelled' && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Cancel ${s.orgName}'s subscription?`)) cancelSub.mutate(s.orgId); }}>Cancel</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(subs?.data ?? []).length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No subscriptions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
