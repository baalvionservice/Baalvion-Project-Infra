import { PageContent } from "@/components/cms/page-content"
import { MarketplaceGate } from "@/components/access/marketplace-gate"

function ShopLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceGate returnTo="/shop" withNav>{children}</MarketplaceGate>
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ShopLayout>{children}<PageContent slug="shop" tone="dark" /></ShopLayout>
}
