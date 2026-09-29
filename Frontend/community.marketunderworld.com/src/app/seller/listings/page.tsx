"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Package, Plus, Pencil } from "lucide-react"
import { NexusCard, NexusBadge } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { useToast } from "@/hooks/use-toast"
import { listMyStores, listStoreProducts, createStoreProduct, listMySellerApplications, type CommerceStoreSummary, type CommerceProduct, type SellerApplication } from "@/lib/api/commerce-admin"
import { useRouter } from "next/navigation"

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
  const [stores, setStores] = useState<CommerceStoreSummary[]>([]);
  const [storeId, setStoreId] = useState<string>("");
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pendingApplication, setPendingApplication] = useState<SellerApplication | null>(null);

  useEffect(() => {
    listMyStores().then((s) => {
      setStores(s);
      if (s.length > 0) { setStoreId(s[0].id); return; }
      setLoading(false);
      listMySellerApplications().then((apps) => setPendingApplication(apps.find((a) => a.status === "pending") ?? null)).catch(() => {});
    });
  }, []);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    listStoreProducts(storeId, { limit: 100 })
      .then((res) => setProducts(res.items))
      .catch((err) => toast({ variant: "destructive", title: "Couldn't load listings", description: err instanceof Error ? err.message : "Please try again." }))
      .finally(() => setLoading(false));
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!storeId) return;
    setCreating(true);
    try {
      const product = await createStoreProduct(storeId, { name: "Untitled listing" });
      router.push(`/seller/listings/${product.id}/edit?storeId=${storeId}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't create listing", description: err instanceof Error ? err.message : "Please try again." });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-10 space-y-8 max-w-[1000px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Your Listings</h1>
          <p className="text-gray-500 font-medium text-lg">Create and edit your product listings — photos, pricing, SEO.</p>
        </div>
        <NexusButton onClick={handleCreate} isLoading={creating} disabled={!storeId} className="gap-2">
          <Plus className="w-4 h-4" /> New Listing
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

      {loading ? (
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
        <NexusCard className="p-16 text-center border-white/5 bg-white/[0.01]">
          <Package className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No listings yet — create your first one.</p>
        </NexusCard>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <NexusCard key={p.id} className="p-4 border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Package className="w-4 h-4 text-gray-600 shrink-0" />
                  <p className="text-sm font-bold text-white truncate">{p.name}</p>
                  <NexusBadge variant={STATUS_BADGE[p.status]}>{p.status}</NexusBadge>
                </div>
                <Link href={`/seller/listings/${p.id}/edit?storeId=${storeId}`}>
                  <NexusButton size="sm" variant="outline" className="gap-2 text-[10px] h-8">
                    <Pencil className="w-3 h-3" /> Edit
                  </NexusButton>
                </Link>
              </div>
            </NexusCard>
          ))}
        </div>
      )}
    </div>
  )
}
