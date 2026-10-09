"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Check, Circle, ExternalLink, Lock, Rocket, Save } from "lucide-react"
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
import { getMyMember, type MyMember } from "@/lib/api/members"
import { STATUS_COPY, defaultVariantPrice, listingReadiness } from "@/lib/seller-listing"

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

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-gray-600">{hint}</span>}
    </label>
  );
}

const STEPS: { key: "draft" | "review" | "live"; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "review", label: "In review" },
  { key: "live", label: "Live in the marketplace" },
];
const stepIndex = (s: CommerceProduct["status"]) => (s === "published" ? 2 : s === "pending_review" || s === "approved" ? 1 : 0);

export default function EditListingPage() {
  const { productId } = useParams<{ productId: string }>();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [storeId, setStoreId] = useState<string>(searchParams.get("storeId") ?? "");
  const [categories, setCategories] = useState<CommerceCategory[]>([]);
  const [media, setMedia] = useState<CommerceProductMedia[]>([]);
  const [product, setProduct] = useState<CommerceProduct | null>(null);
  const [member, setMember] = useState<MyMember | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [blocker, setBlocker] = useState<string | null>(null);

  useEffect(() => { getMyMember().then(setMember).catch(() => {}); }, []);
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
        const current = defaultVariantPrice(p);
        setForm({
          name: p.name,
          slug: p.slug,
          shortDescription: p.shortDescription ?? "",
          description: p.description ?? "",
          categoryId: p.categoryId ?? "",
          sku: p.sku ?? "",
          tags: (p.tags ?? []).join(", "),
          stockQuantity: p.stockQuantity ?? 0,
          price: current != null && current > 0 ? String(current) : "",
          currencyCode: (p.variants ?? [])[0]?.currencyCode ?? "USD",
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

  const priceNumber = form.price ? Number(form.price) : null;
  const readiness = listingReadiness({ name: form.name, categoryId: form.categoryId, shortDescription: form.shortDescription, price: priceNumber, photos: media.filter((m) => m.mediaType === "image").length });

  // Returns true when everything was saved, so submit never continues after a failed save.
  const handleSave = async (): Promise<boolean> => {
    if (!storeId || !productId) return false;
    setSaving(true);
    try {
      // A listing that still has its placeholder web address follows the name the seller gave it.
      const followName = !!product && /^untitled-listing/.test(product.slug) && form.slug === product.slug && form.name.trim() && !/^untitled listing$/i.test(form.name.trim());
      await updateStoreProduct(storeId, productId, {
        name: form.name,
        slug: followName ? form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || undefined : form.slug || undefined,
        shortDescription: form.shortDescription || undefined,
        description: form.description || undefined,
        categoryId: form.categoryId || null,
        sku: form.sku || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        stockQuantity: form.stockQuantity,
        seoMetadata: { ...(product?.seoMetadata ?? {}), title: form.metaTitle || undefined, description: form.metaDescription || undefined },
      });
      if (priceNumber && priceNumber > 0) {
        await updateStoreProductPricing(storeId, productId, { price: priceNumber, currencyCode: form.currencyCode });
      }
      toast({ title: "Listing saved", description: product?.status === "published" ? "Your changes are live." : "Saved as a draft — only you can see it until you submit it." });
      load();
      return true;
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't save listing", description: err instanceof Error ? err.message : "Please try again." });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!storeId || !productId) return;
    setBlocker(null);
    setPublishing(true);
    try {
      if (!(await handleSave())) return;
      const res = await fetch(`/api/commerce-proxy/stores/${storeId}/products/${productId}/publish`, { method: "POST", credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body?.error?.code === "DEPOSIT_REQUIRED") { setBlocker(body.error.message); return; }
        throw new Error(body?.error?.message || `Submission failed (${res.status})`);
      }
      toast({ title: "Submitted for review", description: "An admin will review this listing. It goes live in the marketplace once approved." });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't submit listing", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setPublishing(false);
    }
  };

  if (loading && !product) {
    return <div className="p-10 text-gray-500 font-medium">Loading…</div>;
  }
  if (!product) {
    return (
      <div className="p-10 max-w-[900px] mx-auto space-y-3">
        <p className="text-white font-bold text-lg">This listing isn&apos;t available</p>
        <p className="text-gray-500">It may not exist, or it belongs to another seller.</p>
        <Link href="/seller/listings" className="text-cyan-400 text-sm">← Back to my listings</Link>
      </div>
    );
  }

  const copy = STATUS_COPY[product.status];
  const current = stepIndex(product.status);
  const categorySlug = flatCategories.find((c) => c.id === product.categoryId)?.slug;
  const canSubmit = product.status === "draft" || product.status === "rejected";
  const shopName = member?.seller?.application.storeName ?? member?.displayName;

  return (
    <div className="p-10 space-y-8 max-w-[900px] mx-auto">
      <header className="space-y-5">
        <Link href="/seller/listings" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white"><ArrowLeft className="w-3.5 h-3.5" /> My listings{shopName ? ` · ${shopName}` : ""}</Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold tracking-tight mb-2 break-words">{form.name || "Untitled listing"}</h1>
            <p className="text-gray-500 font-medium">{copy.next}</p>
            {member && <p className="text-[11px] text-gray-600 mt-1">Your listing · <span className="font-mono">{member.memberNumber}</span></p>}
            {product.status === "rejected" && typeof product.customFields?.moderationRejectionReason === "string" && (
              <p className="text-sm text-red-400 mt-2 max-w-xl">Reason: {product.customFields.moderationRejectionReason}</p>
            )}
          </div>
          <div className="flex gap-3 shrink-0">
            {product.status === "published" && categorySlug && (
              <Link href={`/shop/${categorySlug}/${product.slug}`} target="_blank"><NexusButton variant="ghost" className="gap-2"><ExternalLink className="w-4 h-4" /> View live</NexusButton></Link>
            )}
            <NexusButton variant="outline" onClick={handleSave} isLoading={saving} className="gap-2"><Save className="w-4 h-4" /> Save</NexusButton>
            {canSubmit && (
              <NexusButton onClick={handleSubmit} isLoading={publishing} disabled={!readiness.ready} className="gap-2" title={readiness.ready ? undefined : `Still needed: ${readiness.missing.join(", ")}`}>
                <Rocket className="w-4 h-4" /> Submit for review
              </NexusButton>
            )}
          </div>
        </div>

        <ol className="flex items-center gap-2 flex-wrap" aria-label="Listing progress">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-2 px-3 h-8 rounded-full text-xs font-bold ${i < current ? "bg-emerald-500/10 text-emerald-400" : i === current ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/30" : "bg-white/5 text-gray-600"}`}>
                {i < current ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3 h-3" />} {s.label}
              </span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-white/10" />}
            </li>
          ))}
        </ol>
        {product.status === "published" && <p className="text-xs text-amber-300/80">This listing is live — changes you save appear in the marketplace straight away.</p>}
      </header>

      {blocker && (
        <NexusCard className="p-5 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-amber-100">{blocker}</p>
            <Link href="/seller/access" className="text-sm font-bold text-cyan-400">Unlock this category →</Link>
          </div>
        </NexusCard>
      )}

      {canSubmit && !readiness.ready && (
        <NexusCard className="p-5 border-white/10 bg-white/[0.02] space-y-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Before you can submit</p>
          <ul className="space-y-1">
            {readiness.missing.map((m) => <li key={m} className="text-sm text-gray-300 flex items-center gap-2"><Circle className="w-3 h-3 text-gray-600" /> {m}</li>)}
          </ul>
        </NexusCard>
      )}

      <NexusCard className="p-6 space-y-5 border-white/5 bg-white/[0.01]">
        <h3 className="font-bold text-sm uppercase tracking-widest text-gray-500">Basics</h3>
        <Field label="Listing name">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. iPhone 16 Pro 256GB, sealed" className={inputCls} />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Web address" hint="The last part of your listing's link.">
            <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="iphone-16-pro-256gb" className={inputCls} />
          </Field>
          <Field label="Category" hint="You can only list in categories you've unlocked.">
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className={inputCls}>
              <option value="">Choose a category</option>
              {flatCategories.map((c) => <option key={c.id} value={c.id}>{"—".repeat(c.depth)} {c.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Short description" hint="One or two lines shown on the listing card (at least 10 characters).">
          <textarea value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} className={`${inputCls} h-20 resize-none`} />
        </Field>
        <Field label="Full description" hint="Condition, what's in the box, anything a buyer should know.">
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={`${inputCls} h-32 resize-none`} />
        </Field>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="SKU (optional)"><input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className={inputCls} /></Field>
          <Field label="Units in stock"><input type="number" min={0} value={form.stockQuantity} onChange={(e) => setForm((f) => ({ ...f, stockQuantity: Number(e.target.value) }))} className={inputCls} /></Field>
          <Field label="Tags (optional)" hint="Comma-separated."><input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} className={inputCls} /></Field>
        </div>
      </NexusCard>

      <NexusCard className="p-6 space-y-5 border-white/5 bg-white/[0.01]">
        <h3 className="font-bold text-sm uppercase tracking-widest text-gray-500">Pricing</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Price" hint="What a buyer pays for one unit.">
            <input type="number" min={0} step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" className={inputCls} />
          </Field>
          <Field label="Currency">
            <input value={form.currencyCode} onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value.toUpperCase() }))} maxLength={3} className={inputCls} />
          </Field>
        </div>
      </NexusCard>

      <NexusCard className="p-6 space-y-4 border-white/5 bg-white/[0.01]">
        <h3 className="font-bold text-sm uppercase tracking-widest text-gray-500">Photos</h3>
        <PhotoUploadField storeId={storeId} productId={productId} media={media} onChange={setMedia} />
      </NexusCard>

      <NexusCard className="p-6 space-y-5 border-white/5 bg-white/[0.01]">
        <h3 className="font-bold text-sm uppercase tracking-widest text-gray-500">Search listing (optional)</h3>
        <Field label="Page title" hint="Defaults to the listing name.">
          <input value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} maxLength={70} className={inputCls} />
        </Field>
        <Field label="Page description" hint="Defaults to the short description.">
          <textarea value={form.metaDescription} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} maxLength={160} className={`${inputCls} h-20 resize-none`} />
        </Field>
      </NexusCard>
    </div>
  )
}
