import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Plus, Trash2, Tag, Loader2, Package } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { useMarketplaceCatalog, useCreateQuote } from "@/hooks/usePlatform";
import type { MarketplaceProduct } from "@/lib/platformClient";

const money = (n?: number) => `$${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const CATEGORIES = ["all", "residential", "mobile", "datacenter", "dedicated", "geo", "api", "addon"];

interface CartLine { sku: string; name: string; unit: string; basePrice: number; qty: number; }

export default function Marketplace() {
  const [category, setCategory] = useState("all");
  const { data: products, isLoading } = useMarketplaceCatalog(category === "all" ? undefined : category);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [region, setRegion] = useState("");
  const [promo, setPromo] = useState("");
  const createQuote = useCreateQuote();
  const [quoteResult, setQuoteResult] = useState<{ total: number; discount: number; quoteId: string | null } | null>(null);

  const addToCart = (p: MarketplaceProduct) => {
    setCart((c) => c.find((l) => l.sku === p.sku) ? c : [...c, { sku: p.sku, name: p.name, unit: p.unit, basePrice: Number(p.base_price), qty: 1 }]);
  };
  const setQty = (sku: string, qty: number) => setCart((c) => c.map((l) => l.sku === sku ? { ...l, qty: Math.max(1, qty) } : l));
  const remove = (sku: string) => setCart((c) => c.filter((l) => l.sku !== sku));

  const estSubtotal = useMemo(() => cart.reduce((s, l) => s + l.basePrice * l.qty, 0), [cart]);

  const requestQuote = () => {
    createQuote.mutate(
      { items: cart.map((l) => ({ sku: l.sku, qty: l.qty })), region: region || undefined, promo: promo || undefined },
      { onSuccess: (q) => setQuoteResult({ total: q.total, discount: q.discount, quoteId: q.quoteId }) },
    );
  };

  return (
    <div className="space-y-6">
      <SEOHead title="Marketplace" description="Browse proxy products, build a quote, apply promotions and regional pricing." />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-primary" /> Marketplace</h1>
        <p className="text-muted-foreground">Residential · mobile · datacenter · dedicated · geo · API products — build a quote with promo + regional pricing.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)} className="capitalize">{c}</Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Catalog */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading catalog…</div>
          ) : (products ?? []).length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground"><Package className="w-8 h-8 mx-auto mb-2 opacity-50" /> No products in this category yet.</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(products ?? []).map((p) => (
                <Card key={p.sku}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <Badge variant="secondary">{p.category}</Badge>
                    </div>
                    <CardDescription className="text-xs"><code className="font-mono">{p.sku}</code></CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div className="text-lg font-bold">{money(p.base_price)}<span className="text-xs text-muted-foreground font-normal">/{p.unit}</span></div>
                    <Button size="sm" onClick={() => addToCart(p)}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quote builder */}
        <div>
          <Card className="sticky top-4">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag className="w-4 h-4" /> Quote Builder</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? <p className="text-sm text-muted-foreground py-4 text-center">Add products to build a quote.</p> : (
                <div className="space-y-2">
                  {cart.map((l) => (
                    <div key={l.sku} className="flex items-center gap-2 text-sm">
                      <span className="flex-1 truncate">{l.name}</span>
                      <Input type="number" min={1} value={l.qty} onChange={(e) => setQty(l.sku, Number(e.target.value))} className="w-16 h-8" />
                      <span className="w-16 text-right text-muted-foreground">{money(l.basePrice * l.qty)}</span>
                      <button onClick={() => remove(l.sku)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Region</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="us" className="h-8" /></div>
                <div className="space-y-1"><Label className="text-xs">Promo code</Label><Input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="SAVE10" className="h-8" /></div>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Est. subtotal</span>
                <span className="font-semibold">{money(estSubtotal)}</span>
              </div>
              <Button className="w-full" disabled={cart.length === 0 || createQuote.isPending} onClick={requestQuote}>
                {createQuote.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Tag className="w-4 h-4 mr-1" />} Get Quote
              </Button>
              {quoteResult && (
                <div className="rounded-lg bg-secondary/40 p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-success">−{money(quoteResult.discount)}</span></div>
                  <div className="flex justify-between font-bold"><span>Total</span><span>{money(quoteResult.total)}</span></div>
                  {quoteResult.quoteId && <p className="text-xs text-muted-foreground">Quote #{String(quoteResult.quoteId).slice(0, 8)} saved.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
