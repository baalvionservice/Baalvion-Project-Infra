import type { Metadata } from "next"
import { pageMetadata } from "@/lib/cms"
export const generateMetadata = (): Promise<Metadata> => pageMetadata("live-sessions", { title: "Live sessions | Hell Road", description: "Join live learning sessions with teachers on Hell Road." })
import { PageContent } from "@/components/cms/page-content"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}<PageContent slug="live-sessions" tone="light" /></>
}
