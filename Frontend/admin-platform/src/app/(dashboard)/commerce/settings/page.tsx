'use client';

import { useEffect, useState } from 'react';
import { Settings, Plus, Pencil, Trash2, Globe } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useCommerceStores,
  useCreateCommerceStore,
  useUpdateCommerceStore,
  useDeleteCommerceStore,
} from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';
import { useUIStore } from '@/lib/store/uiStore';
import type { CommerceStore, CreateStorePayload } from '@/lib/types/commerce.types';

const CURRENCIES = ['AED', 'INR', 'USD', 'GBP', 'EUR', 'SAR', 'QAR', 'KWD', 'BHD'];
const COUNTRIES = [
  { code: 'AE', name: 'UAE' },
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'USA' },
  { code: 'GB', name: 'UK' },
  { code: 'DE', name: 'Germany' },
  { code: 'SA', name: 'Saudi Arabia' },
];

interface StoreForm {
  name: string;
  slug: string;
  currencyCode: string;
  countryCode: string;
  timezone: string;
  email: string;
  phone: string;
}

const defaultForm: StoreForm = {
  name: '',
  slug: '',
  currencyCode: 'USD',
  countryCode: 'US',
  timezone: 'UTC',
  email: '',
  phone: '',
};

export default function CommerceSettingsPage() {
  const { setBreadcrumbs } = useUIStore();
  const { activeStoreId, setActiveStore } = useCommerceStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<CommerceStore | null>(null);
  const [form, setForm] = useState<StoreForm>(defaultForm);

  const { data, isLoading } = useCommerceStores({ limit: 50 });
  const createStore = useCreateCommerceStore();
  const updateStore = useUpdateCommerceStore(editingStore?.id ?? '');
  const deleteStore = useDeleteCommerceStore();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Commerce', href: '/commerce' }, { label: 'Settings' }]);
  }, [setBreadcrumbs]);

  const stores = data?.data ?? [];

  const openCreate = () => {
    setEditingStore(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (s: CommerceStore) => {
    setEditingStore(s);
    setForm({
      name: s.name,
      slug: s.slug ?? '',
      currencyCode: s.currencyCode,
      countryCode: s.countryCode,
      timezone: s.timezone ?? 'UTC',
      email: s.email ?? '',
      phone: s.phone ?? '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: CreateStorePayload = {
      name: form.name,
      slug: form.slug || undefined,
      currencyCode: form.currencyCode,
      countryCode: form.countryCode,
      timezone: form.timezone || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
    };
    if (editingStore) {
      updateStore.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    } else {
      createStore.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commerce Settings"
        description="Manage your stores and global configuration"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Store
          </Button>
        }
      />

      <Tabs defaultValue="stores">
        <TabsList>
          <TabsTrigger value="stores">Stores</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="stores" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : stores.length === 0 ? (
            <div className="py-12 text-center">
              <Globe className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">No stores yet</p>
              <Button size="sm" onClick={openCreate}>Create Store</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {stores.map((store) => (
                <Card key={store.id} className={activeStoreId === store.id ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-lg">
                          {store.currencyCode === 'AED' ? '🇦🇪' : store.currencyCode === 'INR' ? '🇮🇳' : store.currencyCode === 'USD' ? '🇺🇸' : store.currencyCode === 'GBP' ? '🇬🇧' : '🏪'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{store.name}</p>
                            {activeStoreId === store.id && (
                              <Badge variant="outline" className="text-[10px] text-primary">Active</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {store.currencyCode} · {store.countryCode}
                            {store.timezone ? ` · ${store.timezone}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={store.status} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setActiveStore(store)}
                        >
                          {activeStoreId === store.id ? 'Selected' : 'Select'}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(store)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteStore.mutate(store.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Global Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Global commerce settings such as tax configuration, payment gateways, and shipping defaults are managed at the store level. Select a store above to configure it.
              </p>
              <div className="rounded-md border bg-muted/30 p-4">
                <p className="text-xs font-mono text-muted-foreground">
                  Active Store: {activeStoreId ?? 'None selected'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStore ? 'Edit Store' : 'New Store'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Store Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Amarise UAE"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="amarise-uae"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Currency *</Label>
                <Select value={form.currencyCode} onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <Select value={form.countryCode} onValueChange={(v) => setForm((f) => ({ ...f, countryCode: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Input
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                placeholder="Asia/Dubai"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="store@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+971 4 000 0000"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.name || createStore.isPending || updateStore.isPending}
            >
              {editingStore ? 'Save Changes' : 'Create Store'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
