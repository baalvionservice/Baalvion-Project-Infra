import { PageContent } from "@/components/cms/page-content"
import { WithNavbar } from "@/components/layout/with-navbar"

function InnerLayout({ children }: { children: React.ReactNode }) {
  return <WithNavbar>{children}</WithNavbar>
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <InnerLayout>{children}<PageContent slug="privacy" tone="light" /></InnerLayout>
}
