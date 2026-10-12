import { PageContent } from "@/components/cms/page-content"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("marketplace", { title: "Marketplace", description: "Browse the Hell Road marketplace." })
import { MarketplaceGate } from "@/components/access/marketplace-gate"

function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceGate returnTo="/marketplace">{children}</MarketplaceGate>
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MarketplaceLayout>{children}<PageContent slug="marketplace" tone="light" /></MarketplaceLayout>
}
