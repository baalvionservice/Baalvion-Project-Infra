'use client';

import { useRouter } from 'next/navigation';
import { Package, FolderTree, ShoppingCart, UserCog, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommerceStores, useCommerceCategories } from '@/lib/queries/commerce-stores.queries';
import { useCommerceStore } from '@/lib/store/commerceStore';

// CMS website slug -> commerce store code. Only sites that sell products appear here.
const SHOP_STORE_CODE: Record<string, string> = {
  'amarise-maison-avenue': 'amarise',
};

function countTree(nodes: { children?: unknown[] }[] | undefined): number {
  return (nodes ?? []).reduce(
    (n, c) => n + 1 + countTree((c.children ?? []) as { children?: unknown[] }[]),
    0,
  );
}

export function hasShop(websiteSlug: string): boolean {
  return websiteSlug in SHOP_STORE_CODE;
}

export default function WebsiteShopPanel({ websiteSlug }: { websiteSlug: string }) {
  const router = useRouter();
  const setActiveStore = useCommerceStore((s) => s.setActiveStore);
  const { data, isLoading } = useCommerceStores({ limit: 200 });
  const store = (data?.data ?? []).find((s) => s.code.toLowerCase() === SHOP_STORE_CODE[websiteSlug]);
  const { data: categories } = useCommerceCategories(store?.id ?? '');
  const total = countTree(categories);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!store) return null;

  const open = (href: string) => () => {
    setActiveStore(store);
    router.push(href);
  };

  const tools = [
    { title: 'Products', text: 'Add products with photos, price, description and stock.', icon: Package, href: '/commerce/products', highlight: true },
    { title: 'Brands, categories & subcategories', text: `${total} in the shop menu. Add, rename, reorder.`, icon: FolderTree, href: '/commerce/categories' },
    { title: 'Orders', text: 'Customer orders and fulfilment.', icon: ShoppingCart, href: '/commerce/orders' },
    { title: 'Shop team', text: 'Give people product, SEO, operations or admin access to this shop only.', icon: UserCog, href: '/commerce/team' },
  ];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Store className="h-4 w-4" /> Online shop
        </h2>
        <p className="text-xs text-muted-foreground">
          {store.name} · prices are entered in {store.currencyCode} and converted for each country automatically.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((t) => (
          <button key={t.title} type="button" onClick={open(t.href)} className="text-left">
            <Card className={`h-full transition-shadow hover:shadow-md ${t.highlight ? 'border-primary/40 ring-1 ring-primary/20' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <t.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <CardTitle className="text-sm">{t.title}</CardTitle>
                    <CardDescription className="mt-0.5 text-xs">{t.text}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>
        ))}
      </div>
    </section>
  );
}
