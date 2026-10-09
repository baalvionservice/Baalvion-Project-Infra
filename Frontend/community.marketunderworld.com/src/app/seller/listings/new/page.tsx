"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Package, ArrowRight, Loader2, ImageOff } from "lucide-react"
import { NexusCard } from "@/components/ui/nexus-card"
import { NexusButton } from "@/components/ui/nexus-button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { listMyStores, createStoreProduct, listStoreCategories, type CommerceCategory } from "@/lib/api/commerce-admin"
import { useAuth } from "@/context/auth-context"

export default function CreateListingPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { toast } = useToast()
  
  const [storeId, setStoreId] = useState<string>("")
  const [categories, setCategories] = useState<CommerceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  
  const [name, setName] = useState("")
  const [categoryId, setCategoryId] = useState("")

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/signin?redirect=' + encodeURIComponent('/seller/listings/new'))
      return
    }
    if (!isAuthenticated) return

    listMyStores().then((stores) => {
      if (stores.length > 0) {
        setStoreId(stores[0].id)
        listStoreCategories(stores[0].id).then(setCategories).catch(() => {})
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!storeId) return
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Listing name is required" })
      return
    }
    if (!categoryId) {
      toast({ variant: "destructive", title: "Please select a category" })
      return
    }

    setCreating(true)
    try {
      const product = await createStoreProduct(storeId, { 
        name: name.trim(),
        categoryId,
      })
      toast({ title: "Draft created!" })
      router.push(`/seller/listings/${product.id}/edit?storeId=${storeId}`)
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't create listing", description: err instanceof Error ? err.message : "Please try again." })
      setCreating(false)
    }
  }

  if (loading || authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050508] pt-24 flex items-center justify-center gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white pt-10 px-6 pb-32">
      <div className="max-w-[600px] mx-auto space-y-10">
        <header>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6">
            <Package className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Create New Listing</h1>
          <p className="text-gray-500 text-lg">Start a new draft. You can add photos, pricing, and details on the next screen.</p>
        </header>

        <NexusCard className="p-8 bg-white/[0.02] border-white/5 space-y-8">
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Product Name</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vintage Leather Jacket"
              className="h-14 text-lg font-medium bg-black/40 border-white/10 focus:border-cyan-500/50" 
            />
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
            {categories.length === 0 ? (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-sm">
                You haven't unlocked any categories yet. Visit <a href="/seller/access" className="font-bold underline hover:text-amber-300">Access & Tokens</a> to unlock one first.
              </div>
            ) : (
              <div className="grid gap-3">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(c.id)}
                    className={`p-4 rounded-xl border transition-all text-left flex items-center justify-between ${
                      categoryId === c.id 
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" 
                        : "bg-black/40 border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <span className="font-bold">{c.name}</span>
                    {categoryId === c.id && <ArrowRight className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </NexusCard>

        <div className="flex justify-end gap-4">
          <NexusButton variant="outline" className="h-12 border-white/10" onClick={() => router.push('/seller/listings')}>Cancel</NexusButton>
          <NexusButton 
            onClick={handleCreate} 
            disabled={!name.trim() || !categoryId || creating} 
            className="h-12 bg-cyan-400 text-black font-bold min-w-[140px]"
          >
            {creating ? "Creating..." : "Continue to Details"}
          </NexusButton>
        </div>
      </div>
    </div>
  )
}
