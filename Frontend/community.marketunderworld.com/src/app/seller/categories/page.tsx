"use client"

import { useEffect, useState } from "react"
import { FolderTree, Plus, Trash2, Pencil } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import {
  listStoreCategories,
  createStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  listMyStores,
  type CommerceCategory,
  type CommerceStoreSummary,
  type CategoryInput,
} from "@/lib/api/commerce-admin"

// Flattens the tree (children[]) into a depth-ordered list for a simple indented table — the
// backend already returns a sorted tree (categoryService.buildTree), so this just walks it.
function flatten(nodes: CommerceCategory[], out: CommerceCategory[] = []): CommerceCategory[] {
  for (const node of nodes) {
    out.push(node);
    if (node.children?.length) flatten(node.children, out);
  }
  return out;
}

const emptyForm: CategoryInput = { name: "", slug: "", parentId: null, sortOrder: 0 };

export default function SellerCategoriesPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<CommerceStoreSummary[]>([]);
  const [storeId, setStoreId] = useState<string>("");
  const [tree, setTree] = useState<CommerceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listMyStores().then((s) => { setStores(s); if (s.length > 0) setStoreId(s[0].id); else setLoading(false); });
  }, []);

  const load = () => {
    if (!storeId) return;
    setLoading(true);
    listStoreCategories(storeId)
      .then(setTree)
      .catch((err) => toast({ variant: "destructive", title: "Couldn't load categories", description: err instanceof Error ? err.message : "Please try again." }))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const flat = flatten(tree);

  const startCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true); };
  const startEdit = (cat: CommerceCategory) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, slug: cat.slug, parentId: cat.parentId, sortOrder: cat.sortOrder, isActive: cat.isActive });
    setFormOpen(true);
  };

  const submit = async () => {
    if (!storeId || !form.name) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateStoreCategory(storeId, editingId, form);
        toast({ title: "Category updated" });
      } else {
        await createStoreCategory(storeId, form);
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
      await deleteStoreCategory(storeId, cat.id);
      toast({ title: "Category deleted" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't delete category", description: err instanceof Error ? err.message : "It may still have products or subcategories." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-10 space-y-8 max-w-[1000px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Your Categories</h1>
          <p className="text-gray-500 font-medium text-lg">Organize your store&apos;s catalog into categories and subcategories.</p>
        </div>
        <NexusButton onClick={startCreate} disabled={!storeId} className="gap-2">
          <Plus className="w-4 h-4" /> New Category
        </NexusButton>
      </header>

      {stores.length > 1 && (
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
        >
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      {formOpen && (
        <NexusCard className="p-6 space-y-4 border-cyan-500/20 bg-cyan-500/[0.03]">
          <h3 className="font-bold text-white">{editingId ? "Edit category" : "New category"}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Category name"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
            />
            <select
              value={form.parentId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value || null }))}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none"
            >
              <option value="">No parent (top-level)</option>
              {flat.filter((c) => c.id !== editingId).map((c) => (
                <option key={c.id} value={c.id}>{"—".repeat(c.depth)} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <NexusButton size="sm" isLoading={saving} onClick={submit}>Save</NexusButton>
            <NexusButton size="sm" variant="ghost" onClick={() => setFormOpen(false)}>Cancel</NexusButton>
          </div>
        </NexusCard>
      )}

      {loading ? (
        <div className="text-gray-500 font-medium">Loading…</div>
      ) : flat.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <FolderTree className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No categories yet — create your first one.</p>
        </NexusCard>
      ) : (
        <div className="space-y-2">
          {flat.map((cat) => (
            <NexusCard key={cat.id} className="p-4 border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between gap-4" style={{ paddingLeft: cat.depth * 20 }}>
                <div className="flex items-center gap-3 min-w-0">
                  <FolderTree className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <p className="text-sm font-bold text-white truncate">{cat.name}</p>
                  <NexusBadge variant={cat.isActive ? "success" : "default"}>{cat.isActive ? "active" : "inactive"}</NexusBadge>
                  <span className="text-xs text-gray-500">{cat.productCount} products</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <NexusButton size="sm" variant="outline" onClick={() => startEdit(cat)} className="gap-2 text-[10px] h-8">
                    <Pencil className="w-3 h-3" /> Edit
                  </NexusButton>
                  <NexusButton
                    size="sm"
                    variant="danger"
                    isLoading={busyId === cat.id}
                    onClick={() => handleDelete(cat)}
                    className="gap-2 text-[10px] h-8"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
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
