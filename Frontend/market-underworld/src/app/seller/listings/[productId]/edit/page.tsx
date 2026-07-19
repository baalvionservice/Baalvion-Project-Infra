"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Save, Rocket } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { PhotoUploadField } from "@/components/seller/PhotoUploadField"
import {
  listMyStores,
  getStoreProduct,
  updateStoreProduct,
  updateStoreProductPricing,
  listStoreCategories,
  listProductMedia,
  type CommerceProduct,
  type CommerceCategory,
  type CommerceProductMedia,
} from "@/lib/api/commerce-admin"

interface FormState {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  sku: string;
  tags: string; // comma-separated in the UI, array on the wire
  stockQuantity: number;
  price: string;
  currencyCode: string;
  metaTitle: string;
  metaDescription: string;
}

const emptyForm: FormState = {
  name: "", slug: "", shortDescription: "", description: "", categoryId: "", sku: "",
  tags: "", stockQuantity: 0, price: "", currencyCode: "USD", metaTitle: "", metaDescription: "",
};

export default function EditListingPage() {
  const { productId } = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [storeId, setStoreId] = useState<string>(searchParams.get("storeId") ?? "");
  const [categories, setCategories] = useState<CommerceCategory[]>([]);
  const [media, setMedia] = useState<CommerceProductMedia[]>([]);
  const [product, setProduct] = useState<CommerceProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (storeId) return;
    listMyStores().then((s) => { if (s.length > 0) setStoreId(s[0].id); });
  }, [storeId]);

  const load = useCallback(() => {
    if (!storeId || !productId) return;
    setLoading(true);
    Promise.all([
      getStoreProduct(storeId, productId),
      listStoreCategories(storeId),
      listProductMedia(storeId, productId),
    ])
      .then(([p, cats, mediaRows]) => {
        setProduct(p);
        setCategories(cats);
        setMedia(mediaRows);
        const seo = (p.seoMetadata ?? {}) as Record<string, unknown>;
        setForm({
          name: p.name,
          slug: p.slug,
          shortDescription: p.shortDescription ?? "",
          description: p.description ?? "",
          categoryId: p.categoryId ?? "",
          sku: p.sku ?? "",
          tags: (p.tags ?? []).join(", "),
          stockQuantity: p.stockQuantity ?? 0,
          price: "",
          currencyCode: "USD",
          // seoMetadata keys are `title`/`description` — matches what
          // storefrontSerializer.serializeProductDetail() actually reads (seoTitle/seoDescription
          // come from seo.title/seo.description), not metaTitle/metaDescription.
          metaTitle: typeof seo.title === "string" ? seo.title : "",
          metaDescription: typeof seo.description === "string" ? seo.description : "",
        });
      })
      .catch((err) => toast({ variant: "destructive", title: "Couldn't load listing", description: err instanceof Error ? err.message : "Please try again." }))
      .finally(() => setLoading(false));
  }, [storeId, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const flatCategories = (() => {
    const out: CommerceCategory[] = [];
    const walk = (nodes: CommerceCategory[]) => nodes.forEach((n) => { out.push(n); if (n.children?.length) walk(n.children); });
    walk(categories);
    return out;
  })();

  const handleSave = async () => {
    if (!storeId || !productId) return;
    setSaving(true);
    try {
      await updateStoreProduct(storeId, productId, {
        name: form.name,
        slug: form.slug || undefined,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        categoryId: form.categoryId || null,
        sku: form.sku || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        stockQuantity: form.stockQuantity,
        seoMetadata: { ...(product?.seoMetadata ?? {}), title: form.metaTitle || undefined, description: form.metaDescription || undefined },
      });
      if (form.price) {
        await updateStoreProductPricing(storeId, productId, {
          price: Number(form.price),
          currencyCode: form.currencyCode,
        });
      }
      toast({ title: "Listing saved" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't save listing", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!storeId || !productId) return;
    setPublishing(true);
    try {
      await handleSave();
      const res = await fetch(`/api/commerce-proxy/stores/${storeId}/products/${productId}/publish`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(`Publish failed: ${res.status}`);
      toast({ title: "Listing published" });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't publish listing", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setPublishing(false);
    }
  };

  if (loading || !product) {
    return <div className="p-10 text-gray-500 font-medium">Loading…</div>;
  }

  return (
    <div className="p-10 space-y-8 max-w-[900px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Edit Listing</h1>
          <p className="text-gray-500 font-medium text-lg">{product.status === "published" ? "Live on the storefront." : `Status: ${product.status}`}</p>
        </div>
        <div className="flex gap-3">
          <NexusButton variant="outline" onClick={handleSave} isLoading={saving} className="gap-2">
            <Save className="w-4 h-4" /> Save
          </NexusButton>
          {product.status !== "published" && (
            <NexusButton onClick={handlePublish} isLoading={publishing} className="gap-2">
              <Rocket className="w-4 h-4" /> Publish
            </NexusButton>
          )}
        </div>
      </header>

      <NexusCard className="p-6 space-y-4 border-white/5 bg-white/[0.01]">
        <h3 className="font-bold text-white text-sm uppercase tracking-widest text-gray-500">Basics</h3>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Listing name"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            placeholder="URL slug"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
          />
          <select
            value={form.categoryId}
            onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none"
          >
            <option value="">No category</option>
            {flatCategories.map((c) => <option key={c.id} value={c.id}>{"—".repeat(c.depth)} {c.name}</option>)}
          </select>
        </div>
        <textarea
          value={form.shortDescription}
          onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
          placeholder="Short description (shown in listing cards)"
          className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 resize-none"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Full description"
          className="w-full h-32 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 resize-none"
        />
        <div className="grid md:grid-cols-3 gap-4">
          <input
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            placeholder="SKU"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
          />
          <input
            type="number"
            value={form.stockQuantity}
            onChange={(e) => setForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))}
            placeholder="Stock quantity"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
          />
          <input
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="Tags (comma-separated)"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
          />
        </div>
      </NexusCard>

      <NexusCard className="p-6 space-y-4 border-white/5 bg-white/[0.01]">
        <h3 className="font-bold text-white text-sm uppercase tracking-widest text-gray-500">Pricing</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="number"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="Price (leave blank to keep current)"
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
          />
          <input
            value={form.currencyCode}
            onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value.toUpperCase() }))}
            placeholder="Currency (USD)"
            maxLength={3}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
          />
        </div>
      </NexusCard>

      <NexusCard className="p-6 space-y-4 border-white/5 bg-white/[0.01]">
        <h3 className="font-bold text-white text-sm uppercase tracking-widest text-gray-500">Photos</h3>
        <PhotoUploadField storeId={storeId} productId={productId} media={media} onChange={setMedia} />
      </NexusCard>

      <NexusCard className="p-6 space-y-4 border-white/5 bg-white/[0.01]">
        <h3 className="font-bold text-white text-sm uppercase tracking-widest text-gray-500">SEO</h3>
        <input
          value={form.metaTitle}
          onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
          placeholder="Meta title (defaults to listing name)"
          maxLength={70}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
        />
        <textarea
          value={form.metaDescription}
          onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
          placeholder="Meta description (defaults to short description)"
          maxLength={160}
          className="w-full h-20 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 resize-none"
        />
      </NexusCard>
    </div>
  )
}
