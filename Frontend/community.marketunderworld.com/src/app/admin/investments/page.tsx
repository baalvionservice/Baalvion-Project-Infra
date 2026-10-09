"use client";

import { useCallback, useEffect, useState } from "react";
import { MARKET_UNDERWORLD_STORE_ID } from "@/lib/api/commerce";
import {
  createStoreCategory, createStoreProduct, listStoreCategories, listStoreProducts, moderateProduct,
  updateStoreProductPricing, type CommerceCategory, type CommerceProduct,
} from "@/lib/api/commerce-admin";

const STORE = MARKET_UNDERWORLD_STORE_ID;
const box = "bg-white rounded-xl shadow-sm border border-gray-100";
const input = "w-full border p-2.5 rounded-lg outline-none focus:border-fuchsia-500 text-sm";
const msg = (e: unknown, f: string) => (e instanceof Error ? e.message : f);
const num = (v: string) => (v.trim() === "" ? undefined : Number(v));
const DEFAULT_RISK = "Projected revenue is an estimate, not a promise. You may lose some or all of the money you put in.";

function flatten(tree: CommerceCategory[]): CommerceCategory[] {
  return tree.flatMap((c) => [c, ...flatten(c.children ?? [])]);
}

export default function AdminInvestmentsPage() {
  const [category, setCategory] = useState<CommerceCategory | null>(null);
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", creatorName: "", platform: "YouTube", channelUrl: "", ticketPrice: "", units: "",
    investmentAmount: "", expectedRevenue: "", investorSharePct: "", platformFeePct: "", riskNote: DEFAULT_RISK,
    channelOwnershipChecked: false, revenueEvidenceSeen: false, verificationNotes: "",
  });

  const load = useCallback(async () => {
    try {
      setError("");
      const cat = flatten(await listStoreCategories(STORE)).find((c) => c.slug === "investments") ?? null;
      setCategory(cat);
      const res = await listStoreProducts(STORE, { limit: 100 });
      setProducts(res.items.filter((p) => p.customFields && (p.customFields as { requiresKyc?: boolean }).requiresKyc === true));
    } catch (e) { setError(msg(e, "Could not load")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const createCategory = async () => {
    try {
      await createStoreCategory(STORE, { name: "Investments", slug: "investments", description: "Creator investment opportunities. Identity verification required to buy." });
      await load();
    } catch (e) { setError(msg(e, "Could not create the category")); }
  };

  const post = async () => {
    setError(""); setNotice("");
    const price = num(form.ticketPrice);
    const units = num(form.units);
    if (!category) return setError("Create the Investments category first.");
    if (!form.name.trim() || !form.description.trim()) return setError("Name and description are required.");
    if (!price || price <= 0 || !units || units < 1) return setError("Enter a ticket price and number of units.");
    if (!/^https:\/\//i.test(form.channelUrl)) return setError("The channel link must start with https://");
    if (!form.riskNote.trim()) return setError("A risk note is required.");
    if ((form.channelOwnershipChecked || form.revenueEvidenceSeen) && form.verificationNotes.trim().length < 10) return setError("Describe how you verified it (at least a sentence). Buyers are told it was checked.");
    setBusy(true);
    try {
      const created = await createStoreProduct(STORE, {
        categoryId: category.id, name: form.name.trim(), description: form.description.trim(), stockQuantity: units,
        customFields: {
          requiresKyc: true,
          investment: {
            creatorName: form.creatorName.trim(), platform: form.platform, channelUrl: form.channelUrl.trim(),
            investmentAmount: num(form.investmentAmount), expectedRevenue: num(form.expectedRevenue),
            investorSharePct: num(form.investorSharePct), platformFeePct: num(form.platformFeePct), riskNote: form.riskNote.trim(),
            verification: {
              channelOwnershipChecked: form.channelOwnershipChecked,
              revenueEvidenceSeen: form.revenueEvidenceSeen,
              checkedAt: form.channelOwnershipChecked || form.revenueEvidenceSeen ? new Date().toISOString() : undefined,
              notes: form.verificationNotes.trim() || undefined,
            },
          },
        },
      });
      await updateStoreProductPricing(STORE, created.id, { price, currencyCode: "USD" });
      const pub = await fetch(`/api/commerce-proxy/stores/${STORE}/products/${created.id}/publish`, { method: "POST", credentials: "include" });
      if (!pub.ok) throw new Error("Created, but publishing failed. Open it from the seller listings page.");
      await moderateProduct(STORE, created.id, "approve");
      setNotice(`"${created.name}" is live in the Investments shop and requires KYC to buy.`);
      setForm({ ...form, name: "", description: "", creatorName: "", channelUrl: "", ticketPrice: "", units: "", investmentAmount: "", expectedRevenue: "", investorSharePct: "", platformFeePct: "", channelOwnershipChecked: false, revenueEvidenceSeen: false, verificationNotes: "" });
      await load();
    } catch (e) { setError(msg(e, "Could not post the listing")); } finally { setBusy(false); }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investment listings</h1>
        <p className="text-gray-500 mt-2">Each listing is a product that only identity-verified buyers can purchase. Only post what you have confirmed with the creator. Payment is handled by normal checkout.</p>
      </div>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p>}

      {!category ? (
        <div className={`${box} p-6 space-y-3`}>
          <p className="text-sm text-gray-600">There is no Investments category in the store yet.</p>
          <button onClick={createCategory} className="px-5 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium">Create Investments category</button>
        </div>
      ) : (
        <div className={`${box} p-6 space-y-3`}>
          <h2 className="font-semibold">New listing</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className={input} placeholder="Listing name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={input} placeholder="Creator name" value={form.creatorName} onChange={(e) => setForm({ ...form, creatorName: e.target.value })} />
            <select className={input} value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}>{["YouTube", "Instagram", "TikTok", "Podcast", "Live streaming"].map((p) => <option key={p}>{p}</option>)}</select>
            <input className={input} placeholder="Channel link (https://...)" value={form.channelUrl} onChange={(e) => setForm({ ...form, channelUrl: e.target.value })} />
            <input className={input} type="number" placeholder="Price per unit (USD)" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} />
            <input className={input} type="number" placeholder="Units available" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
            <input className={input} type="number" placeholder="Total sought (USD)" value={form.investmentAmount} onChange={(e) => setForm({ ...form, investmentAmount: e.target.value })} />
            <input className={input} type="number" placeholder="Projected revenue (USD, estimate)" value={form.expectedRevenue} onChange={(e) => setForm({ ...form, expectedRevenue: e.target.value })} />
            <input className={input} type="number" placeholder="Investor share (%)" value={form.investorSharePct} onChange={(e) => setForm({ ...form, investorSharePct: e.target.value })} />
            <input className={input} type="number" placeholder="Platform fee (%)" value={form.platformFeePct} onChange={(e) => setForm({ ...form, platformFeePct: e.target.value })} />
          </div>
          <textarea className={input} rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="rounded-lg border border-gray-200 p-3 space-y-2">
            <p className="text-sm font-medium">What have you verified? <span className="font-normal text-gray-500">Only tick what you actually checked; buyers see these ticks.</span></p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.channelOwnershipChecked} onChange={(e) => setForm({ ...form, channelOwnershipChecked: e.target.checked })} /> I confirmed the creator owns this channel (for example, by a code placed in the channel description)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.revenueEvidenceSeen} onChange={(e) => setForm({ ...form, revenueEvidenceSeen: e.target.checked })} /> I reviewed evidence of the channel&apos;s revenue (for example, analytics or payout statements)</label>
            <textarea className={input} rows={2} placeholder="How did you check? (kept private, required if you tick anything)" value={form.verificationNotes} onChange={(e) => setForm({ ...form, verificationNotes: e.target.value })} />
          </div>
          <textarea className={input} rows={2} placeholder="Risk note shown to buyers" value={form.riskNote} onChange={(e) => setForm({ ...form, riskNote: e.target.value })} />
          <button onClick={post} disabled={busy} className="px-5 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium disabled:opacity-60">{busy ? "Posting…" : "Post listing"}</button>
        </div>
      )}

      <div className={`${box} divide-y divide-gray-50`}>
        {products.length === 0 && <p className="p-6 text-center text-gray-400 text-sm">No investment listings yet.</p>}
        {products.map((p) => (
          <div key={p.id} className="p-4 flex justify-between gap-3">
            <div><div className="font-medium">{p.name}</div><div className="text-xs text-gray-500">{p.stockQuantity} units · KYC required</div></div>
            <span className="px-2 py-1 h-fit rounded-md text-xs font-semibold uppercase bg-gray-100">{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
