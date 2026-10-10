import { MarketplaceGate } from "@/components/access/marketplace-gate"

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceGate returnTo="/shop">{children}</MarketplaceGate>
}
