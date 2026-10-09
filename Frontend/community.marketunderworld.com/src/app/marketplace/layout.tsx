import { MarketplaceGate } from "@/components/access/marketplace-gate"

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceGate returnTo="/marketplace">{children}</MarketplaceGate>
}
