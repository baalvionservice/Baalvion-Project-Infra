import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("premium", { title: "Premium", description: "What Hell Road premium includes." })
import { PageContent } from "@/components/cms/page-content"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}<PageContent slug="premium" tone="light" /></>
}
