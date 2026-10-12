import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("access", { title: "Membership tiers | Hell Road", description: "See what each Hell Road membership tier unlocks and how to pay." })
import { PageContent } from "@/components/cms/page-content"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}<PageContent slug="access" tone="dark" /></>
}
