import { PageContent } from "@/components/cms/page-content"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("dating", { title: "Dating and founders | Hell Road", description: "Meet verified adults, including founders. Mutual likes only, no paid dates, 18 and over." })
import { WithNavbar } from "@/components/layout/with-navbar"

function InnerLayout({ children }: { children: React.ReactNode }) {
  return <WithNavbar>{children}</WithNavbar>
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <InnerLayout>{children}<PageContent slug="dating" tone="dark" /></InnerLayout>
}
