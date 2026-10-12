import { PageContent } from "@/components/cms/page-content"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("gift-cards", { title: "Gift cards | Hell Road", description: "Buy and send Hell Road gift cards." })
import { WithNavbar } from "@/components/layout/with-navbar"

function InnerLayout({ children }: { children: React.ReactNode }) {
  return <WithNavbar>{children}</WithNavbar>
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <InnerLayout>{children}<PageContent slug="gift-cards" tone="light" /></InnerLayout>
}
