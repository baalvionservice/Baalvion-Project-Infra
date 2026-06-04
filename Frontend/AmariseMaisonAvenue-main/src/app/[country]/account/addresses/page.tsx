'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  MapPin,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Star,
  X,
  AlertCircle,
  Loader2,
  Building2,
  Phone,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  addressApi,
  customerApi,
  type SavedAddress,
  type AddressInput,
} from '@/lib/api-client';

/**
 * Address Book — the authenticated shopper's REAL saved addresses from order-service
 * (/orders/stores/:storeId/customers/me/addresses, self-resolved from the bearer
 * token). Honest loading / empty / error states; no mock data.
 */

type AddressType = SavedAddress['addressType'];

const ADDRESS_TYPES: ReadonlyArray<{ value: AddressType; label: string }> = [
  { value: 'shipping', label: 'Shipping' },
  { value: 'billing', label: 'Billing' },
  { value: 'both', label: 'Shipping & Billing' },
];

/** Two-letter country options shown in the form. The route value seeds the default. */
const COUNTRY_OPTIONS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'AE', label: 'United Arab Emirates' },
  { code: 'IN', label: 'India' },
  { code: 'SG', label: 'Singapore' },
];

type FormState = {
  addressType: AddressType;
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  countryCode: string;
  phone: string;
  isDefault: boolean;
};

const emptyForm = (countryCode: string): FormState => ({
  addressType: 'shipping',
  firstName: '',
  lastName: '',
  company: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  countryCode: countryCode.toUpperCase(),
  phone: '',
  isDefault: false,
});

const formFromAddress = (a: SavedAddress): FormState => ({
  addressType: a.addressType,
  firstName: a.firstName,
  lastName: a.lastName,
  company: a.company ?? '',
  address1: a.address1,
  address2: a.address2 ?? '',
  city: a.city,
  state: a.state ?? '',
  zip: a.zip ?? '',
  countryCode: a.countryCode.toUpperCase(),
  phone: a.phone ?? '',
  isDefault: a.isDefault,
});

/** Map the editable form to the API shape, trimming and nulling optionals. */
const toAddressInput = (f: FormState): AddressInput => ({
  addressType: f.addressType,
  firstName: f.firstName.trim(),
  lastName: f.lastName.trim(),
  company: f.company.trim() || null,
  address1: f.address1.trim(),
  address2: f.address2.trim() || null,
  city: f.city.trim(),
  state: f.state.trim() || null,
  zip: f.zip.trim() || null,
  countryCode: f.countryCode.trim().toUpperCase(),
  phone: f.phone.trim() || null,
  isDefault: f.isDefault,
});

/** A create error of "no customer profile yet" → we must seed the customer first. */
const isNoCustomerError = (message: string): boolean =>
  /no customer profile/i.test(message);

export default function AddressBookPage() {
  const { country } = useParams();
  const countryCode = (country as string) || 'us';
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog / form
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(countryCode));
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Per-card action feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await addressApi.listMine();
    if (res.ok) {
      setAddresses(res.data);
      setError(null);
    } else if (isNoCustomerError(res.error.message)) {
      // No customer row yet just means no addresses — treat as an honest empty state.
      setAddresses([]);
      setError(null);
    } else {
      setError(res.error.message || 'Could not load your addresses.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm(countryCode));
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (a: SavedAddress) => {
    setEditingId(a.id);
    setForm(formFromAddress(a));
    setFormError(null);
    setDialogOpen(true);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** Required: firstName, lastName, address1, city, countryCode. */
  const validate = (f: FormState): string | null => {
    if (!f.firstName.trim()) return 'First name is required.';
    if (!f.lastName.trim()) return 'Last name is required.';
    if (!f.address1.trim()) return 'Address line 1 is required.';
    if (!f.city.trim()) return 'City is required.';
    if (f.countryCode.trim().length !== 2) return 'A 2-letter country code is required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      const body = toAddressInput(form);

      if (editingId) {
        const res = await addressApi.update(editingId, body);
        if (!res.ok) {
          setFormError(res.error.message || 'Could not update this address.');
          return;
        }
      } else {
        let res = await addressApi.create(body);
        // First-ever save can 404 if no customer row exists yet — seed it once, then retry.
        if (!res.ok && isNoCustomerError(res.error.message) && user?.email) {
          const ensured = await ensureCustomer(user.email, user.name);
          if (!ensured.ok) {
            setFormError(ensured.error.message || 'Could not create your profile.');
            return;
          }
          res = await addressApi.create(body);
        }
        if (!res.ok) {
          setFormError(res.error.message || 'Could not save this address.');
          return;
        }
      }

      await load();
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await addressApi.update(id, { isDefault: true });
      if (!res.ok) {
        setActionError(res.error.message || 'Could not set this address as default.');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await addressApi.remove(id);
      if (!res.ok) {
        // The backend refuses to delete the default with a 403 — surface it gracefully.
        setActionError(res.error.message || 'Could not delete this address.');
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={!!editingId}
        form={form}
        setField={setField}
        formError={formError}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <header className="flex flex-wrap justify-between items-end gap-6">
        <div className="space-y-2">
          <nav className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400 flex items-center space-x-2">
            <Link href={`/${countryCode}/account`}>Dashboard</Link>
            <ChevronRight className="w-2.5 h-2.5" />
            <span className="text-plum">Addresses</span>
          </nav>
          <h1 className="text-4xl font-headline font-bold italic tracking-tight text-gray-900 uppercase">
            Address Book
          </h1>
          <p className="text-sm text-gray-500 font-light italic">
            Your saved delivery and billing addresses.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="rounded-none bg-black text-white hover:bg-plum h-12 px-8 text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          <Plus className="w-3.5 h-3.5 mr-2" /> Add Address
        </Button>
      </header>

      {actionError && (
        <div className="flex items-center space-x-3 bg-red-50 border border-red-200 px-6 py-4 text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-[11px] font-bold uppercase tracking-widest">{actionError}</p>
        </div>
      )}

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center text-gray-400 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-plum" />
          <p className="text-[10px] font-bold uppercase tracking-widest italic">
            Loading your addresses…
          </p>
        </div>
      ) : error ? (
        <div className="py-32 flex flex-col items-center justify-center text-red-500 space-y-3">
          <AlertCircle className="w-8 h-8" />
          <p className="text-[11px] font-bold uppercase tracking-widest">{error}</p>
        </div>
      ) : addresses.length === 0 ? (
        <Card className="bg-white border-border shadow-sm rounded-none py-24 text-center space-y-5">
          <MapPin className="w-12 h-12 mx-auto text-gray-300" />
          <p className="text-sm font-bold uppercase tracking-widest italic text-gray-400">
            No saved addresses yet
          </p>
          <Button
            onClick={openCreate}
            variant="outline"
            className="rounded-none border-plum/30 text-plum hover:bg-plum hover:text-white h-11 px-8 text-[10px] font-bold uppercase tracking-widest"
          >
            <Plus className="w-3.5 h-3.5 mr-2" /> Add your first address
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((a) => (
            <AddressCard
              key={a.id}
              address={a}
              busy={busyId === a.id}
              onEdit={() => openEdit(a)}
              onSetDefault={() => handleSetDefault(a.id)}
              onDelete={() => handleDelete(a.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Seed the customer row (find-or-create) before the first address save. */
async function ensureCustomer(email: string, name?: string) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] || 'Maison';
  const lastName = parts.slice(1).join(' ') || 'Client';
  return customerApi.ensure({ email, firstName, lastName });
}

function AddressCard({
  address,
  busy,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  address: SavedAddress;
  busy: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const typeLabel =
    ADDRESS_TYPES.find((t) => t.value === address.addressType)?.label ??
    address.addressType;

  return (
    <Card className="bg-white border-border shadow-sm rounded-none p-8 space-y-6 group hover:border-plum transition-all relative">
      {busy && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
          <Loader2 className="w-5 h-5 animate-spin text-plum" />
        </div>
      )}

      <div className="flex items-start justify-between">
        <Badge
          variant="outline"
          className="text-[8px] uppercase tracking-widest border-border text-gray-400 px-3 py-1 rounded-none"
        >
          {typeLabel}
        </Badge>
        {address.isDefault && (
          <Badge className="bg-plum/10 text-plum border-none text-[8px] uppercase tracking-widest inline-flex items-center">
            <Star className="w-2.5 h-2.5 mr-1 fill-plum" /> Default
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-bold uppercase tracking-tight text-gray-900">
          {address.firstName} {address.lastName}
        </p>
        {address.company && (
          <p className="text-[11px] text-gray-500 font-light inline-flex items-center">
            <Building2 className="w-3 h-3 mr-1.5 text-gray-300" />
            {address.company}
          </p>
        )}
        <p className="text-[12px] text-gray-600 font-light leading-relaxed">
          {address.address1}
          {address.address2 ? <><br />{address.address2}</> : null}
          <br />
          {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
          <br />
          <span className="font-mono uppercase text-[10px] text-gray-400 tracking-widest">
            {address.countryCode}
          </span>
        </p>
        {address.phone && (
          <p className="text-[11px] text-gray-500 font-light inline-flex items-center pt-1">
            <Phone className="w-3 h-3 mr-1.5 text-gray-300" />
            {address.phone}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-border flex items-center gap-2 flex-wrap">
        {!address.isDefault && (
          <Button
            variant="ghost"
            onClick={onSetDefault}
            disabled={busy}
            className="h-9 px-3 rounded-none text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-plum disabled:opacity-50"
          >
            <Star className="w-3 h-3 mr-1.5" /> Set default
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onEdit}
          disabled={busy}
          className="h-9 px-3 rounded-none text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-plum disabled:opacity-50"
        >
          <Pencil className="w-3 h-3 mr-1.5" /> Edit
        </Button>
        <Button
          variant="ghost"
          onClick={onDelete}
          disabled={busy}
          className="h-9 px-3 rounded-none text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-600 ml-auto disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3 mr-1.5" /> Delete
        </Button>
      </div>
    </Card>
  );
}

function AddressFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setField,
  formError,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  formError: string | null;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const fieldClass = 'rounded-none border-slate-200 h-12 text-sm font-light';
  const labelClass = 'text-[10px] uppercase font-bold tracking-widest text-slate-500';
  const selectClass =
    'w-full h-12 px-3 rounded-none border border-slate-200 bg-white text-sm font-light focus:outline-none focus:ring-2 focus:ring-plum/30 focus:border-plum';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-none shadow-2xl rounded-none p-0 overflow-hidden">
        <div className="flex flex-col max-h-[85vh]">
          <div className="bg-ivory p-8 border-b border-border flex items-start justify-between shrink-0">
            <div className="space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-plum">
                Address Book
              </span>
              <h3 className="text-2xl font-headline font-bold italic leading-tight text-gray-900">
                {editing ? 'Edit address' : 'Add address'}
              </h3>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={onSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              <Label htmlFor="addr-type" className={labelClass}>
                Address Type
              </Label>
              <select
                id="addr-type"
                className={selectClass}
                value={form.addressType}
                onChange={(e) => setField('addressType', e.target.value as AddressType)}
              >
                {ADDRESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="addr-first" className={labelClass}>
                  First Name <span className="text-plum">*</span>
                </Label>
                <Input
                  id="addr-first"
                  className={fieldClass}
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  required
                  aria-required="true"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="addr-last" className={labelClass}>
                  Last Name <span className="text-plum">*</span>
                </Label>
                <Input
                  id="addr-last"
                  className={fieldClass}
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="addr-company" className={labelClass}>
                Company (optional)
              </Label>
              <Input
                id="addr-company"
                className={fieldClass}
                value={form.company}
                onChange={(e) => setField('company', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="addr-1" className={labelClass}>
                Address Line 1 <span className="text-plum">*</span>
              </Label>
              <Input
                id="addr-1"
                className={fieldClass}
                value={form.address1}
                onChange={(e) => setField('address1', e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="addr-2" className={labelClass}>
                Address Line 2 (optional)
              </Label>
              <Input
                id="addr-2"
                className={fieldClass}
                value={form.address2}
                onChange={(e) => setField('address2', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="addr-city" className={labelClass}>
                  City <span className="text-plum">*</span>
                </Label>
                <Input
                  id="addr-city"
                  className={fieldClass}
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  required
                  aria-required="true"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="addr-state" className={labelClass}>
                  State / Region
                </Label>
                <Input
                  id="addr-state"
                  className={fieldClass}
                  value={form.state}
                  onChange={(e) => setField('state', e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="addr-zip" className={labelClass}>
                  Postal Code
                </Label>
                <Input
                  id="addr-zip"
                  className={fieldClass}
                  value={form.zip}
                  onChange={(e) => setField('zip', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="addr-country" className={labelClass}>
                  Country <span className="text-plum">*</span>
                </Label>
                <select
                  id="addr-country"
                  className={selectClass}
                  value={form.countryCode}
                  onChange={(e) => setField('countryCode', e.target.value)}
                  required
                  aria-required="true"
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="addr-phone" className={labelClass}>
                  Phone (optional)
                </Label>
                <Input
                  id="addr-phone"
                  className={fieldClass}
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+1 555 000 0000"
                />
              </div>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer select-none">
              <Checkbox
                checked={form.isDefault}
                onCheckedChange={(checked) => setField('isDefault', checked === true)}
                className="rounded-none border-slate-300 data-[state=checked]:bg-plum data-[state=checked]:border-plum"
              />
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-600">
                Set as default address
              </span>
            </label>

            {formError && (
              <div className="flex items-center space-x-3 bg-red-50 border border-red-200 px-4 py-3 text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-[11px] font-medium">{formError}</p>
              </div>
            )}

            <div className="pt-6 border-t border-border flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-none border-border h-12 px-8 text-[10px] font-bold uppercase tracking-widest"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-none bg-black text-white hover:bg-plum h-12 px-12 text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Address'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
