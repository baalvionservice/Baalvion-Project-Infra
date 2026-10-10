"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ExternalLink, ImageOff, Package, Pencil, Plus } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import {
  listMyStores, listStoreProducts, createStoreProduct, listMySellerApplications, listProductMedia, listStoreCategories,
  type CommerceStoreSummary, type CommerceProduct, type CommerceCategory, type SellerApplication,
} from "@/lib/api/commerce-admin"
import { getMyMember, type MyMember } from "@/lib/api/members"
import { STATUS_COPY, defaultVariantPrice, money } from "@/lib/seller-listing"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

const STATUS_BADGE: Record<CommerceProduct["status"], "default" | "success" | "warning" | "info"> = {
  draft: "default",
  pending_review: "warning",
  approved: "info",
  published: "success",
  archived: "default",
  rejected: "warning",
};

export default function SellerListingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [stores, setStores] = useState<CommerceStoreSummary[]>([]);
  const [storeId, setStoreId] = useState<string>("");
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({});
  const [categories, setCategories] = useState<CommerceCategory[]>([]);
  const [member, setMember] = useState<MyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pendingApplication, setPendingApplication] = useState<SellerApplication | null>(null);

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin?redirect=' + encodeURIComponent('/seller/listings'))
      return
    }
    if (!isAuthenticated) return

    getMyMember().then(setMember).catch(() => {});
    listMyStores().then((s) => {
      setStores(s);
      if (s.length > 0) { setStoreId(s[0].id); return; }
      setLoading(false);
      listMySellerApplications().then((apps) => setPendingApplication(apps.find((a) => a.status === "pending") ?? null)).catch(() => {});
    });
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    // The server only returns this seller's own listings.
    listStoreProducts(storeId, { limit: 100 })
      .then((res) => {
        setProducts(res.items);
        // Photos load in the background so the list appears straight away.
        res.items.forEach((p) => {
          listProductMedia(storeId, p.id)
            .then((m) => setThumbs((t) => ({ ...t, [p.id]: [...m].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder).find((x) => x.mediaType === "image")?.url ?? null })))
            .catch(() => setThumbs((t) => ({ ...t, [p.id]: null })));
        });
      })
      .catch((err) => toast({ variant: "destructive", title: "Couldn't load your listings", description: err instanceof Error ? err.message : "Please try again." }))
      .finally(() => setLoading(false));
    listStoreCategories(storeId).then(setCategories).catch(() => {});
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const categorySlug = useMemo(() => {
    const map = new Map<string, string>();
    const walk = (nodes: CommerceCategory[]) => nodes.forEach((n) => { map.set(n.id, n.slug); if (n.children?.length) walk(n.children); });
    walk(categories);
    return (id: string | null) => (id ? map.get(id) : undefined);
  }, [categories]);

  const counts = useMemo(() => ({
    live: products.filter((p) => p.status === "published").length,
    review: products.filter((p) => p.status === "pending_review").length,
    draft: products.filter((p) => p.status === "draft").length,
    fix: products.filter((p) => p.status === "rejected").length,
  }), [products]);

  const handleCreate = async () => {
    router.push(`/seller/listings/new`);
  };

  const shopName = member?.seller?.application.storeName ?? member?.displayName;

  return (
    <div className="p-10 space-y-8 max-w-[1000px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-[0.2em] mb-2">My store</p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">{shopName ?? "Your listings"}</h1>
          <p className="text-gray-500 font-medium">
            {member ? <><span className="font-mono text-gray-400">{member.memberNumber}</span> · <Link href={member.profilePath} className="text-cyan-400 hover:text-cyan-300">View your public shop</Link></> : "Everything you sell, in one place."}
          </p>
        </div>
        <NexusButton onClick={handleCreate} isLoading={creating} disabled={!storeId} className="gap-2">
          <Plus className="w-4 h-4" /> New Listing
        </NexusButton>
      </header>

      {products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Live", n: counts.live, tone: "text-emerald-400" },
            { label: "In review", n: counts.review, tone: "text-amber-400" },
            { label: "Drafts", n: counts.draft, tone: "text-gray-300" },
            { label: "Need changes", n: counts.fix, tone: "text-red-400" },
          ].map((c) => (
            <NexusCard key={c.label} className="p-4 border-white/5 bg-white/[0.02]">
              <div className={`text-2xl font-bold ${c.tone}`}>{c.n}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{c.label}</div>
            </NexusCard>
          ))}
        </div>
      )}

      {stores.length > 1 && (
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
        >
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      )}

      {loading || authLoading || !isAuthenticated ? (
        <div className="text-gray-500 font-medium">Loading…</div>
      ) : stores.length === 0 ? (
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01] space-y-4">
          {pendingApplication ? (
            <>
              <p className="text-white font-bold text-lg">Application pending review</p>
              <p className="text-gray-500 font-medium">
                Your application for <span className="text-white">{pendingApplication.storeName}</span> is awaiting admin approval before you can list products.
              </p>
            </>
          ) : (
            <>
              <p className="text-white font-bold text-lg">You don't have a store yet</p>
              <p className="text-gray-500 font-medium mb-2">Apply to become a seller to start listing products.</p>
              <Link href="/seller/onboarding">
                <NexusButton className="gap-2">Become a Seller</NexusButton>
              </Link>
            </>
          )}
        </NexusCard>
      ) : products.length === 0 ? (
        <NexusCard className="p-14 text-center border-white/5 bg-white/[0.01] space-y-3">
          <Package className="w-10 h-10 text-gray-700 mx-auto" />
          <p className="text-white font-bold text-lg">You haven&apos;t listed anything yet</p>
          <p className="text-gray-500 font-medium max-w-md mx-auto">Create a listing, add photos and a price, then submit it. Once an admin approves it, it appears in the marketplace for members.</p>
          <NexusButton onClick={handleCreate} isLoading={creating} className="gap-2"><Plus className="w-4 h-4" /> Create your first listing</NexusButton>
        </NexusCard>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const price = defaultVariantPrice(p);
            const copy = STATUS_COPY[p.status];
            const thumb = thumbs[p.id];
            const slug = categorySlug(p.categoryId);
            return (
              <NexusCard key={p.id} className="p-4 border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                    {thumb ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={thumb} alt="" className="w-full h-full object-cover" /> : <ImageOff className="w-5 h-5 text-gray-700" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-bold text-white truncate">{p.name}</p>
                      <NexusBadge variant={STATUS_BADGE[p.status]}>{copy.label}</NexusBadge>
                    </div>
                    <p className="text-xs text-gray-400">{money(price, p.variants?.[0]?.currencyCode)} · {p.stockQuantity} in stock{typeof p.viewCount === "number" ? ` · ${p.viewCount} views` : ""}</p>
                    <p className="text-[11px] text-gray-600">{copy.next}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {p.status === "published" && slug && (
                      <Link href={`/shop/${slug}/${p.slug}`} target="_blank">
                        <NexusButton size="sm" variant="ghost" className="gap-2 text-[10px] h-8"><ExternalLink className="w-3 h-3" /> View live</NexusButton>
                      </Link>
                    )}
                    <Link href={`/seller/listings/${p.id}/edit?storeId=${storeId}`}>
                      <NexusButton size="sm" variant="outline" className="gap-2 text-[10px] h-8"><Pencil className="w-3 h-3" /> Edit</NexusButton>
                    </Link>
                  </div>
                </div>
              </NexusCard>
            );
          })}
        </div>
      )}
    </div>
  )
}
