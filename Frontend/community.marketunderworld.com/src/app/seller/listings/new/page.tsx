"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Copy, ExternalLink, ImagePlus, Loader2, Lock, Plus, Rocket, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/context/auth-context"
import {
  listMyStores, createStoreProduct, updateStoreProduct, updateStoreProductPricing, listStoreCategories, uploadProductMedia, getStoreProduct,
  type CommerceCategory, type CommerceProduct,
} from "@/lib/api/commerce-admin"
import { listingReadiness } from "@/lib/seller-listing"
import { pickMarketStore, publicListingPath } from "@/lib/seller-store"

const field = "w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 text-base text-white outline-none focus:border-cyan-500/60"
const label = "block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2"
const MAX_PHOTOS = 8
const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

interface Shot { file: File; url: string }

// One page to add a product: details, price and photos together, then publish. The draft is created behind the scenes.
export default function NewListingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [storeId, setStoreId] = useState("")
  const [storeName, setStoreName] = useState("")
  const [categories, setCategories] = useState<CommerceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [stock, setStock] = useState("1")
  const [short, setShort] = useState("")
  const [long, setLong] = useState("")
  const [shots, setShots] = useState<Shot[]>([])
  const [busy, setBusy] = useState<"" | "draft" | "publish">("")
  const [step, setStep] = useState("")
  const [blocker, setBlocker] = useState("")
  const [done, setDone] = useState<{ product: CommerceProduct; link: string | null; categoryName: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { router.push("/auth/signin?redirect=" + encodeURIComponent("/seller/listings/new")); return }
    listMyStores().then(async (stores) => {
      const s = pickMarketStore(stores)
      if (s) {
        setStoreId(s.id); setStoreName(s.name)
        const cats = await listStoreCategories(s.id).catch(() => [] as CommerceCategory[])
        setCategories(cats)
        const flat: CommerceCategory[] = []
        const walk = (n: CommerceCategory[]) => n.forEach((c) => { flat.push(c); if (c.children?.length) walk(c.children) })
        walk(cats)
        if (flat.length === 1) setCategoryId(flat[0].id)
      }
    }).finally(() => setLoading(false))
  }, [authLoading, isAuthenticated, router])
  useEffect(() => () => shots.forEach((s) => URL.revokeObjectURL(s.url)), []) // eslint-disable-line react-hooks/exhaustive-deps

  const flat = useMemo(() => {
    const out: CommerceCategory[] = []
    const walk = (n: CommerceCategory[]) => n.forEach((c) => { out.push(c); if (c.children?.length) walk(c.children) })
    walk(categories)
    return out
  }, [categories])
  const priceNum = price ? Number(price) : null
  const ready = listingReadiness({ name, categoryId, shortDescription: short, price: priceNum, photos: shots.length })

  const addFiles = (files: FileList | File[]) => {
    const next = [...shots]
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) { toast({ variant: "destructive", title: `${f.name} is not an image` }); continue }
      if (next.length >= MAX_PHOTOS) { toast({ title: `Up to ${MAX_PHOTOS} photos` }); break }
      next.push({ file: f, url: URL.createObjectURL(f) })
    }
    setShots(next)
  }
  const removeShot = (i: number) => { URL.revokeObjectURL(shots[i].url); setShots(shots.filter((_, j) => j !== i)) }

  const save = async (publish: boolean) => {
    if (!storeId) return
    setBlocker("")
    if (!name.trim() || !categoryId) { toast({ variant: "destructive", title: "Add a name and choose a category" }); return }
    if (publish && !ready.ready) { toast({ variant: "destructive", title: "Almost there", description: `Still needed: ${ready.missing.join(", ")}.` }); return }
    setBusy(publish ? "publish" : "draft")
    let product: CommerceProduct | null = null
    try {
      setStep("Creating your product…")
      product = await createStoreProduct(storeId, { name: name.trim(), categoryId })
      setStep("Saving the details…")
      await updateStoreProduct(storeId, product.id, {
        name: name.trim(), slug: slugify(name) || undefined, shortDescription: short.trim() || undefined, description: long.trim() || undefined,
        categoryId, stockQuantity: Math.max(0, Number(stock) || 0),
      })
      if (priceNum && priceNum > 0) await updateStoreProductPricing(storeId, product.id, { price: priceNum, currencyCode: currency })
      for (let i = 0; i < shots.length; i += 1) {
        setStep(`Uploading photo ${i + 1} of ${shots.length}…`)
        await uploadProductMedia(storeId, product.id, shots[i].file, { isFeatured: i === 0 })
      }
      if (publish) {
        setStep("Publishing…")
        const res = await fetch(`/api/commerce-proxy/stores/${storeId}/products/${product.id}/publish`, { method: "POST", credentials: "include" })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          if (body?.error?.code === "DEPOSIT_REQUIRED") { setBlocker(body.error.message); setBusy(""); setStep(""); toast({ title: "Saved as a draft", description: "Unlock the category to publish it." }); router.replace(`/seller/listings/${product.id}/edit?storeId=${storeId}`); return }
          throw new Error(body?.error?.message || `Could not publish (${res.status})`)
        }
      }
      const fresh = await getStoreProduct(storeId, product.id).catch(() => product as CommerceProduct)
      const cat = flat.find((c) => c.id === categoryId)
      setDone({ product: fresh, link: publicListingPath(cat?.slug, fresh.slug), categoryName: cat?.name ?? "" })
    } catch (e) {
      toast({ variant: "destructive", title: "Could not finish", description: e instanceof Error ? e.message : "Please try again." })
      // The product exists if it got that far, so the seller can carry on from its page instead of starting over.
      if (product) router.replace(`/seller/listings/${product.id}/edit?storeId=${storeId}`)
    } finally { setBusy(""); setStep("") }
  }

  const copyLink = async (path: string) => { try { await navigator.clipboard.writeText(`${window.location.origin}${path}`); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* shown on screen */ } }

  if (loading || authLoading || !isAuthenticated) return <div className="min-h-screen bg-[#050508] pt-24 flex items-center justify-center gap-3 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>

  if (done) {
    const live = done.product.status === "published"
    return (
      <div className="min-h-screen bg-[#050508] text-white pt-10 px-5 pb-32">
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${live ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300"}`}><Check className="w-8 h-8" /></div>
          <h1 className="text-3xl font-bold">{live ? "Your product is live" : done.product.status === "draft" ? "Saved as a draft" : "Sent for review"}</h1>
          <p className="text-gray-400">{live ? "Members can see it in the marketplace now." : done.product.status === "draft" ? "Only you can see it. Open it any time to finish and publish." : "An admin is checking it. It goes live at the link below as soon as it is approved."}</p>
          {done.link && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left space-y-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{live ? "Your public link" : "Your public link (works once approved)"}</p>
              <p className="break-all font-mono text-sm text-cyan-300">{typeof window !== "undefined" ? window.location.origin : ""}{done.link}</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => copyLink(done.link!)} className="h-11 px-5 rounded-lg bg-cyan-400 text-black font-bold flex items-center gap-2">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? "Copied" : "Copy link"}</button>
                {live && <Link href={done.link} target="_blank" className="h-11 px-5 rounded-lg border border-white/15 flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Open</Link>}
              </div>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button onClick={() => { setDone(null); setName(""); setPrice(""); setShort(""); setLong(""); setStock("1"); shots.forEach((s) => URL.revokeObjectURL(s.url)); setShots([]) }} className="h-12 px-6 rounded-xl bg-white text-black font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> Add another product</button>
            <Link href="/seller/listings" className="h-12 px-6 rounded-xl border border-white/15 flex items-center">See all my products</Link>
            <Link href={`/seller/listings/${done.product.id}/edit?storeId=${storeId}`} className="h-12 px-6 rounded-xl border border-white/15 flex items-center">Edit this one</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!storeId) {
    return (
      <div className="min-h-screen bg-[#050508] text-white pt-16 px-5"><div className="max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">You need a seller account first</h1>
        <p className="text-gray-400">Apply once in a single page. When the team approves it, you can add products here.</p>
        <Link href="/seller/onboarding" className="inline-block h-12 leading-[3rem] px-8 rounded-xl bg-cyan-400 text-black font-bold">Become a seller</Link>
      </div></div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-8 px-5 pb-40">
      <div className="max-w-2xl mx-auto space-y-8">
        <header>
          <Link href="/seller/listings" className="text-xs text-gray-500 hover:text-white">← My products{storeName ? ` · ${storeName}` : ""}</Link>
          <h1 className="text-3xl sm:text-4xl font-bold mt-3">Add a product</h1>
          <p className="text-gray-400 mt-2">Everything on one page. Fill it in, add photos, and publish. You get a public link to share the moment it is done.</p>
        </header>

        {flat.length === 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex gap-3"><Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-100">You have not unlocked a category yet, so there is nothing to list in. <Link href="/seller/access" className="font-bold underline">Unlock a category</Link> first.</div></div>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 space-y-5">
          <h2 className="font-bold">1. What are you selling?</h2>
          <div><label className={label} htmlFor="p-name">Product name</label><input id="p-name" className={field} value={name} maxLength={200} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vintage leather jacket, size M" /></div>
          <div><label className={label} htmlFor="p-cat">Category</label>
            <select id="p-cat" className={field} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Choose a category</option>
              {flat.map((c) => <option key={c.id} value={c.id}>{"— ".repeat(c.depth)}{c.name}</option>)}
            </select>
            <p className="text-xs text-gray-600 mt-1">Only categories you have unlocked are shown. <Link href="/seller/access" className="underline">Unlock more</Link></p>
          </div>
          <div><label className={label} htmlFor="p-short">Short description</label><textarea id="p-short" className={`${field} h-24 py-3`} value={short} maxLength={300} onChange={(e) => setShort(e.target.value)} placeholder="One or two lines buyers see first (at least 10 characters)" /></div>
          <div><label className={label} htmlFor="p-long">Full description (optional)</label><textarea id="p-long" className={`${field} h-36 py-3`} value={long} maxLength={4000} onChange={(e) => setLong(e.target.value)} placeholder="Condition, what is included, delivery, anything a buyer should know" /></div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 space-y-5">
          <h2 className="font-bold">2. Price and stock</h2>
          <div className="grid grid-cols-[1fr_120px] gap-4">
            <div><label className={label} htmlFor="p-price">Price</label><input id="p-price" type="number" inputMode="decimal" min={0} step="0.01" className={field} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" /></div>
            <div><label className={label} htmlFor="p-cur">Currency</label><select id="p-cur" className={field} value={currency} onChange={(e) => setCurrency(e.target.value)}><option>USD</option><option>INR</option><option>AED</option></select></div>
          </div>
          <div><label className={label} htmlFor="p-stock">How many do you have?</label><input id="p-stock" type="number" inputMode="numeric" min={0} className={field} value={stock} onChange={(e) => setStock(e.target.value)} /></div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-7 space-y-4">
          <div className="flex items-baseline justify-between"><h2 className="font-bold">3. Photos</h2><span className="text-xs text-gray-500">{shots.length} of {MAX_PHOTOS} · the first is the main photo</span></div>
          <button type="button" onClick={() => file.current?.click()}
            onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}
            className="w-full rounded-2xl border-2 border-dashed border-white/15 hover:border-cyan-500/60 py-10 text-center">
            <ImagePlus className="w-8 h-8 mx-auto text-gray-500" /><span className="block mt-2 font-medium">Tap to add photos</span><span className="block text-xs text-gray-600 mt-1">From your camera or gallery. JPEG, PNG or WebP.</span>
          </button>
          <input ref={file} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = "" }} />
          {shots.length > 0 && (
            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {shots.map((s, i) => (
                <li key={s.url} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1.5 left-1.5 bg-cyan-400 text-black text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">Main</span>}
                  <button type="button" onClick={() => removeShot(i)} aria-label="Remove photo" className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center"><X className="w-4 h-4" /></button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {blocker && <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-100">{blocker}</p>}
      </div>

      <div className="fixed bottom-0 inset-x-0 z-[10001] border-t border-white/10 bg-[#050508]/95 backdrop-blur px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <p className="hidden sm:block flex-1 text-xs text-gray-500 min-w-0 truncate">{busy ? step : ready.ready ? "Ready to publish." : `Still needed: ${ready.missing.join(", ")}`}</p>
          <button onClick={() => save(false)} disabled={!!busy || !name.trim() || !categoryId} className="h-12 px-5 rounded-xl border border-white/15 font-semibold flex items-center gap-2 disabled:opacity-40"><Save className="w-4 h-4" /> <span className="hidden sm:inline">Save draft</span><span className="sm:hidden">Draft</span></button>
          <button onClick={() => save(true)} disabled={!!busy || !ready.ready} className="flex-1 sm:flex-none h-12 px-7 rounded-xl bg-cyan-400 text-black font-bold flex items-center justify-center gap-2 disabled:opacity-40">{busy === "publish" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Publish product</button>
        </div>
        {busy && <p className="sm:hidden text-center text-xs text-gray-400 mt-2">{step}</p>}
        {!busy && !ready.ready && <p className="sm:hidden text-center text-xs text-gray-500 mt-2">Still needed: {ready.missing.join(", ")}</p>}
      </div>
    </div>
  )
}
