"use client"

import { useEffect, useState } from "react"
import { FolderTree, Plus, Trash2, Pencil, Search } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import {
  listAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  listMyStores,
  type CommerceCategory,
  type CommerceStoreSummary,
  type CategoryInput,
} from "@/lib/api/commerce-admin"

const emptyForm: CategoryInput & { storeId: string } = {
  storeId: "",
  name: "",
  slug: "",
  parentId: null,
  sortOrder: 0,
};

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<CommerceStoreSummary[]>([]);
  const [categories, setCategories] = useState<CommerceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { listMyStores().then(setStores); }, []);

  const load = () => {
    setLoading(true);
    listAdminCategories({ storeId: storeFilter || undefined, search: search || undefined, limit: 100 })
      .then((res) => setCategories(res.items))
      .catch((err) => toast({ variant: "destructive", title: "Couldn't load categories", description: err instanceof Error ? err.message : "Please try again." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [storeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const startCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, storeId: storeFilter || stores[0]?.id || "" });
    setFormOpen(true);
  };

  const startEdit = (cat: CommerceCategory) => {
    setEditingId(cat.id);
    setForm({
      storeId: cat.storeId,
      name: cat.name,
      slug: cat.slug,
      parentId: cat.parentId,
      description: cat.description ?? undefined,
      imageUrl: cat.imageUrl ?? undefined,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setFormOpen(true);
  };

  const submit = async () => {
    if (!form.storeId || !form.name) {
      toast({ variant: "destructive", title: "Store and name are required" });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { storeId, ...body } = form;
        await updateAdminCategory(storeId, editingId, body);
        toast({ title: "Category updated" });
      } else {
        const { storeId, ...body } = form;
        await createAdminCategory(storeId, body);
        toast({ title: "Category created" });
      }
      setFormOpen(false);
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't save category", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CommerceCategory) => {
    setBusyId(cat.id);
    try {
      await deleteAdminCategory(cat.storeId, cat.id);
      toast({ title: "Category deleted" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't delete category", description: err instanceof Error ? err.message : "Category may still have products or subcategories." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-10 space-y-8 max-w-[1200px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Categories</h1>
          <p className="text-gray-500 font-medium text-lg">Cross-store category taxonomy — create, edit, and delete categories for any seller&apos;s store.</p>
        </div>
        <NexusButton onClick={startCreate} disabled={stores.length === 0} className="gap-2">
          <Plus className="w-4 h-4" /> New Category
        </NexusButton>
      </header>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
            placeholder="Search category name…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
          />
        </div>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
        >
          <option value="">All stores</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <NexusButton size="sm" variant="outline" onClick={load}>Filter</NexusButton>
      </div>

      {formOpen && (
        <NexusCard className="p-6 space-y-4 border-cyan-500/20 bg-cyan-500/[0.03]">
          <h3 className="font-bold text-white">{editingId ? "Edit category" : "New category"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <select
              value={form.storeId}
              disabled={!!editingId}
              onChange={(e) => setForm((f) => ({ ...f, storeId: e.target.value }))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none disabled:opacity-50"
            >
              <option value="">Select store…</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Category name"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
            />
            <input
              value={form.slug ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Slug (auto-generated if blank)"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
            />
            <input
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              placeholder="Sort order"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex gap-3">
            <NexusButton size="sm" isLoading={saving} onClick={submit}>Save</NexusButton>
            <NexusButton size="sm" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</NexusButton>
          </div>
        </NexusCard>
      )}

      {loading ? (
        <div className="text-gray-500 font-medium">Loading…</div>
      ) : categories.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <FolderTree className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No categories found.</p>
        </NexusCard>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <NexusCard key={cat.id} className="p-5 border-white/5 bg-white/[0.01]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <FolderTree className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{cat.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <NexusBadge>{cat.store?.name ?? cat.storeId}</NexusBadge>
                      <NexusBadge variant={cat.isActive ? "success" : "default"}>{cat.isActive ? "active" : "inactive"}</NexusBadge>
                      <span className="text-xs text-gray-500">{cat.productCount} products</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <NexusButton size="sm" variant="outline" onClick={() => startEdit(cat)} className="gap-2 text-[10px] h-9">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </NexusButton>
                  <NexusButton
                    size="sm"
                    variant="danger"
                    isLoading={busyId === cat.id}
                    onClick={() => handleDelete(cat)}
                    className="gap-2 text-[10px] h-9"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </NexusButton>
                </div>
              </div>
            </NexusCard>
          ))}
        </div>
      )}
    </div>
  )
}
