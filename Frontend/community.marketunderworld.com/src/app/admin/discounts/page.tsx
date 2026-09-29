"use client"

import { useEffect, useState } from "react"
import { ListingCard, Badge } from "@/components/ui/ListingCard"
import { AppButton } from "@/components/ui/AppButton"
import { Tag, Plus, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { listDiscounts, createDiscount, updateDiscount, deleteDiscount, type Discount, type DiscountInput } from "@/lib/api/commerce-admin"
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce"

const emptyForm: DiscountInput = { code: "", name: "", type: "percentage", value: 10 };

export default function AdminDiscountsPage() {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DiscountInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    listDiscounts(MARKET_UNDERWORLD_STORE_ID).then(setDiscounts).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setSaving(true);
    try {
      await createDiscount(MARKET_UNDERWORLD_STORE_ID, { ...form, code: form.code.trim().toUpperCase() });
      toast({ title: "Discount created" });
      setFormOpen(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't create discount", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (d: Discount) => {
    setBusyId(d.id);
    try {
      await updateDiscount(MARKET_UNDERWORLD_STORE_ID, d.id, { isActive: !d.isActive });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't update", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (d: Discount) => {
    if (!window.confirm(`Delete discount code ${d.code}?`)) return;
    setBusyId(d.id);
    try {
      await deleteDiscount(MARKET_UNDERWORLD_STORE_ID, d.id);
      setDiscounts((prev) => prev.filter((x) => x.id !== d.id));
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't delete", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-10 space-y-10 max-w-4xl">
      <header className="flex items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-white">Discount Codes</h1>
          <p className="text-text-muted font-medium">Store-wide promo codes, validated server-side at checkout.</p>
        </div>
        <AppButton onClick={() => setFormOpen((v) => !v)} className="bg-brand-green text-black gap-2">
          <Plus className="w-4 h-4" /> New Code
        </AppButton>
      </header>

      {formOpen && (
        <ListingCard className="p-6 border-brand-border bg-brand-surface space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="CODE (e.g. WELCOME10)"
              className="bg-brand-void border border-brand-border rounded-lg h-10 px-3 text-sm text-white outline-none font-mono uppercase"
            />
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Internal name"
              className="bg-brand-void border border-brand-border rounded-lg h-10 px-3 text-sm text-white outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Discount["type"] }))}
              className="bg-brand-void border border-brand-border rounded-lg h-10 px-3 text-sm text-white outline-none"
            >
              <option value="percentage">Percentage off</option>
              <option value="fixed_amount">Fixed amount off</option>
              <option value="free_shipping">Free shipping</option>
            </select>
            <input
              type="number"
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
              placeholder="Value (e.g. 10 for 10%)"
              className="bg-brand-void border border-brand-border rounded-lg h-10 px-3 text-sm text-white outline-none"
            />
          </div>
          <AppButton onClick={handleCreate} isLoading={saving} className="bg-brand-green text-black">Create</AppButton>
        </ListingCard>
      )}

      {loading ? (
        <div className="p-16 flex items-center justify-center gap-3 text-text-muted"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>
      ) : discounts.length === 0 ? (
        <ListingCard className="p-16 text-center border-brand-border bg-brand-surface">
          <Tag className="w-10 h-10 text-text-ghost mx-auto mb-4" />
          <p className="text-text-muted font-medium">No discount codes yet.</p>
        </ListingCard>
      ) : (
        <div className="space-y-3">
          {discounts.map((d) => (
            <ListingCard key={d.id} className="p-5 border-brand-border bg-brand-surface flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-white">{d.code}</span>
                  <Badge variant={d.isActive ? "success" : "default"} className="text-[8px]">{d.isActive ? "active" : "inactive"}</Badge>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {d.name} · {d.type === "percentage" ? `${d.value}% off` : d.type === "fixed_amount" ? `${d.value} off` : "Free shipping"}
                  {d.usageLimit ? ` · ${d.usageCount}/${d.usageLimit} used` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <AppButton size="sm" variant="secondary" onClick={() => handleToggleActive(d)} disabled={busyId === d.id} className="text-xs">
                  {d.isActive ? "Deactivate" : "Activate"}
                </AppButton>
                <AppButton size="sm" variant="danger" onClick={() => handleDelete(d)} disabled={busyId === d.id} className="gap-1 text-xs">
                  <Trash2 className="w-3.5 h-3.5" />
                </AppButton>
              </div>
            </ListingCard>
          ))}
        </div>
      )}
    </div>
  );
}
